import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { handlePreflight, createSecureResponse, withSecurity } from '@/lib/security';
import { extractRequestContext, createAppError, ErrorCategory, ErrorSeverity, logError, createErrorResponse, withDatabaseRetry } from '@/lib/errorHandler';
import { getAdaptiveRateLimit, RateLimitConfigs, getRateLimitHeaders, withRateLimit } from '@/lib/rateLimiting';
import { verifyWebhookSignature, extractWebhookEventData, retrieveCheckoutSession, retrievePaymentIntent } from '@/lib/stripeServer';
import { sendPurchaseConfirmationEmail, formatCurrency, formatEmailDate } from '@/lib/email';

const adminApp = getAdminApp();
if (!adminApp) {
  throw new Error('Firebase Admin SDK not initialized. Check environment variables.');
}
const db = getFirestore(adminApp);

/**
 * Enhanced Stripe Webhook Handler
 * 
 * Handles Stripe webhook events with comprehensive purchase record creation,
 * idempotency handling, and detailed error logging.
 * 
 * Requirements covered:
 * - 5.1: Webhook signature verification
 * - 5.2: Proper error handling with HTTP status codes
 * - 5.3: Process checkout.session.completed events
 * - 5.4: Idempotency handling to prevent duplicate processing
 * - 5.5: Detailed error logging
 * - 4.1: Save purchase details to Firestore
 * - 4.2: Include comprehensive purchase metadata
 */

// Handle preflight OPTIONS requests (though webhooks typically don't need this)
export async function OPTIONS(request: Request) {
  return handlePreflight(request, 'webhook');
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const context = extractRequestContext(request);
  context.endpoint = '/api/webhooks/stripe';
  
  let eventId: string | undefined;
  let eventType: string | undefined;

  try {
    // Apply security middleware for webhooks
    const securityResult = withSecurity({
      endpointType: 'webhook',
      requireOriginValidation: false, // Webhooks come from Stripe, not browsers
      detectSuspicious: true,
    })(request, context);
    
    // Apply adaptive rate limiting for webhooks (more lenient for Stripe)
    const adaptiveConfig = getAdaptiveRateLimit(request, RateLimitConfigs.webhook);
    const rateLimitCheck = withRateLimit(adaptiveConfig, '/api/webhooks/stripe');
    const rateLimitResult = rateLimitCheck(request, context);
    
    // Add rate limit headers to context
    context.rateLimitHeaders = getRateLimitHeaders(
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
      adaptiveConfig.maxRequests
    );
    // Extract webhook payload and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      throw createAppError(
        'Webhook signature missing from request headers',
        ErrorCategory.WEBHOOK,
        ErrorSeverity.HIGH,
        400,
        'Missing webhook signature',
        { 
          hasBody: !!body,
          bodyLength: body.length,
          headers: Object.fromEntries(request.headers.entries())
        }
      );
    }

    // Verify webhook signature using centralized Stripe utilities
    let event;
    try {
      event = await verifyWebhookSignature(body, signature);
      eventId = event.id;
      eventType = event.type;
      
      // Add event context for logging
      context.additionalData = {
        eventId,
        eventType,
        livemode: event.livemode,
        created: new Date(event.created * 1000).toISOString()
      };
      
      console.log('📨 Webhook event received:', {
        eventId,
        eventType,
        livemode: event.livemode,
        created: new Date(event.created * 1000).toISOString(),
        requestId: context.requestId,
      });
    } catch (verificationError: any) {
      throw createAppError(
        `Webhook signature verification failed: ${verificationError.message}`,
        ErrorCategory.WEBHOOK,
        ErrorSeverity.HIGH,
        400,
        'Webhook signature verification failed',
        { 
          hasBody: !!body,
          bodyLength: body.length,
          hasSignature: !!signature,
          verificationError: verificationError.message
        }
      );
    }

    // Check for idempotency - prevent duplicate processing
    const idempotencyKey = `webhook_${eventId}`;
    const existingProcessing = await withDatabaseRetry(
      () => checkIdempotency(idempotencyKey),
      context
    );
    
    if (existingProcessing) {
      console.log('🔄 Webhook event already processed:', {
        eventId,
        eventType,
        existingTimestamp: existingProcessing.processedAt,
        requestId: context.requestId,
      });
      
      return createSecureResponse(
        { 
          received: true, 
          message: 'Event already processed',
          eventId,
          requestId: context.requestId,
          timestamp: new Date().toISOString()
        },
        request,
        {
          status: 200,
          endpointType: 'webhook',
          additionalHeaders: context.rateLimitHeaders || {},
        }
      );
    }

    // Mark event as being processed with database retry
    await withDatabaseRetry(
      () => markEventProcessing(idempotencyKey, eventId!, eventType!),
      context
    );

    // Extract and validate event data
    const eventData = extractWebhookEventData(event);
    
    if (!eventData) {
      console.log('ℹ️ Unsupported webhook event type, acknowledging:', {
        eventId,
        eventType,
        requestId: context.requestId,
      });
      
      await withDatabaseRetry(
        () => markEventCompleted(idempotencyKey, 'unsupported_event'),
        context
      );
      
      return createSecureResponse(
        { 
          received: true, 
          message: 'Event type not supported',
          eventId,
          requestId: context.requestId,
          timestamp: new Date().toISOString()
        },
        request,
        {
          status: 200,
          endpointType: 'webhook',
          additionalHeaders: context.rateLimitHeaders || {},
        }
      );
    }

    // Process checkout.session.completed events
    if ((eventData as any).eventType === 'checkout.session.completed') {
      await processCheckoutSessionCompleted(eventData, idempotencyKey, context);
    }

    // Mark event as successfully processed
    await withDatabaseRetry(
      () => markEventCompleted(idempotencyKey, 'success'),
      context
    );

    const processingTime = Date.now() - startTime;
    console.log('✅ Webhook processing completed successfully:', {
      eventId,
      eventType,
      processingTimeMs: processingTime,
      requestId: context.requestId,
    });

    return createSecureResponse(
      { 
        received: true, 
        eventId,
        processingTimeMs: processingTime,
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      },
      request,
      {
        status: 200,
        endpointType: 'webhook',
        additionalHeaders: context.rateLimitHeaders || {},
      }
    );

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    // Add processing time to context
    context.additionalData = {
      ...context.additionalData,
      processingTimeMs: processingTime,
      eventId,
      eventType
    };

    // Mark event as failed if we have an idempotency key
    if (eventId) {
      try {
        await markEventCompleted(`webhook_${eventId}`, 'error', error.message);
      } catch (markError: any) {
        logError(markError, {
          ...context,
          additionalData: {
            ...context.additionalData,
            originalError: error.message,
            failedToMarkEvent: true
          }
        });
      }
    }

    return createErrorResponse(error, context);
  }
}

/**
 * Process checkout.session.completed webhook event
 * Creates comprehensive purchase record in Firestore
 */
async function processCheckoutSessionCompleted(eventData: any, idempotencyKey: string, context: any) {
  const { sessionId, customerEmail, amountTotal, currency, paymentIntentId } = eventData;

  // Add transaction context
  context.sessionId = sessionId;
  context.userEmail = customerEmail;
  context.transactionId = sessionId;

  console.log('💳 Processing checkout session completed:', {
    sessionId,
    customerEmail,
    amountTotal,
    currency,
    paymentIntentId,
    requestId: context.requestId,
  });

  // Retrieve full session details from Stripe with retry logic
  const session = await withDatabaseRetry(
    () => retrieveCheckoutSession(sessionId),
    context
  );
  
  // Retrieve payment intent details for additional metadata
  let paymentIntent = null;
  if (paymentIntentId) {
    try {
      paymentIntent = await withDatabaseRetry(
        () => retrievePaymentIntent(paymentIntentId),
        context
      );
    } catch (error: any) {
      // Log warning but don't fail the process
      logError(error, {
        ...context,
        additionalData: {
          ...context.additionalData,
          paymentIntentId,
          failedToRetrievePaymentIntent: true
        }
      });
    }
  }

  // Create comprehensive purchase record
  const purchaseRecord = {
    // Core purchase information
    stripeSessionId: sessionId,
    stripePaymentIntentId: paymentIntentId,
    userEmail: customerEmail,
    
    // Payment details
    amount: amountTotal,
    currency: currency.toUpperCase(),
    status: 'completed',
    
    // Timestamps
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeCreatedAt: new Date(session.created * 1000),
    
    // Product information
    metadata: {
      productName: 'Wedly Service',
      description: 'One-time payment for Wedly service access',
      paymentMethod: session.payment_method_types?.[0] || 'card',
      mode: session.mode,
      ...session.metadata,
    },
    
    // Additional Stripe data
    stripeData: {
      sessionUrl: session.url,
      paymentStatus: session.payment_status,
      customerDetails: session.customer_details,
      lineItems: session.line_items?.data || [],
    },
    
    // Processing metadata
    webhookEventId: eventData.eventId || null,
    idempotencyKey,
    processingTimestamp: new Date(),
  };

  // Add payment intent details if available
  if (paymentIntent) {
    (purchaseRecord.stripeData as any).paymentIntent = {
      status: paymentIntent.status,
      receiptEmail: paymentIntent.receipt_email,
      paymentMethodId: paymentIntent.payment_method,
      charges: (paymentIntent as any).charges?.data || [],
    };
  }

  try {
    // Save purchase record to Firestore with retry logic
    const purchaseRef = db.collection('purchases').doc();
    await withDatabaseRetry(
      () => purchaseRef.set(purchaseRecord),
      context
    );
    
    console.log('💾 Purchase record created successfully:', {
      purchaseId: purchaseRef.id,
      sessionId,
      customerEmail,
      amount: amountTotal,
      requestId: context.requestId,
    });

    // Update user's premium status and purchase history with retry logic
    await withDatabaseRetry(
      () => updateUserPremiumStatus(customerEmail, purchaseRef.id, amountTotal, context),
      context
    );

    console.log('👤 User premium status updated successfully:', {
      customerEmail,
      purchaseId: purchaseRef.id,
      requestId: context.requestId,
    });

    // Send purchase confirmation email (non-blocking)
    await sendConfirmationEmail(purchaseRecord, purchaseRef.id, context);

  } catch (error: any) {
    // Enhanced error context for purchase record failures
    const enhancedContext = {
      ...context,
      additionalData: {
        ...context.additionalData,
        purchaseRecordData: {
          sessionId,
          customerEmail,
          amount: amountTotal,
          currency,
          paymentIntentId
        },
        failedOperation: 'purchase_record_creation'
      }
    };

    throw createAppError(
      `Failed to save purchase record: ${error.message}`,
      ErrorCategory.DATABASE,
      ErrorSeverity.CRITICAL,
      500,
      'Failed to process payment completion',
      enhancedContext.additionalData,
      true
    );
  }
}

/**
 * Send purchase confirmation email to customer
 * Non-blocking operation - errors are logged but don't fail webhook processing
 */
async function sendConfirmationEmail(purchaseRecord: any, purchaseId: string, context: any) {
  try {
    // Extract receipt URL from Stripe data if available
    let receiptUrl = null;
    if (purchaseRecord.stripeData?.paymentIntent?.charges?.length > 0) {
      receiptUrl = purchaseRecord.stripeData.paymentIntent.charges[0].receipt_url;
    }

    // Prepare email data
    const emailData = {
      userEmail: purchaseRecord.userEmail,
      userName: purchaseRecord.stripeData?.customerDetails?.name || 'Valued Customer',
      transactionId: purchaseRecord.stripeSessionId,
      amount: formatCurrency(purchaseRecord.amount, purchaseRecord.currency),
      purchaseDate: formatEmailDate(purchaseRecord.createdAt),
      productName: purchaseRecord.metadata?.productName || 'Wedly Service',
      receiptUrl: receiptUrl
    };

    console.log('📧 Sending purchase confirmation email:', {
      userEmail: emailData.userEmail,
      transactionId: emailData.transactionId,
      amount: emailData.amount,
      purchaseId,
      requestId: context.requestId
    });

    // Send email (non-blocking)
    const emailResult = await sendPurchaseConfirmationEmail(emailData);

    if (emailResult.success) {
      console.log('✅ Purchase confirmation email sent successfully:', {
        messageId: emailResult.messageId,
        userEmail: emailData.userEmail,
        transactionId: emailData.transactionId,
        duration: emailResult.duration,
        purchaseId,
        requestId: context.requestId
      });

      // Optionally update purchase record with email status
      try {
        await withDatabaseRetry(
          () => db.collection('purchases').doc(purchaseId).update({
            emailSent: true,
            emailSentAt: new Date(),
            emailMessageId: emailResult.messageId,
            updatedAt: new Date()
          }),
          context
        );
      } catch (updateError: any) {
        logError(updateError, {
          ...context,
          additionalData: {
            ...context.additionalData,
            purchaseId,
            operation: 'update_email_success_status'
          }
        });
      }

    } else {
      // Log email failure but don't throw error
      logError(new Error(`Email sending failed: ${emailResult.error}`), {
        ...context,
        additionalData: {
          ...context.additionalData,
          emailData,
          emailResult,
          purchaseId,
          operation: 'send_confirmation_email'
        }
      });

      // Update purchase record with email failure status
      try {
        await withDatabaseRetry(
        () => db.collection('purchases').doc(purchaseId).update({
            emailSent: false,
            emailError: emailResult.error,
            emailAttemptedAt: new Date(),
            updatedAt: new Date()
          }),
          context
        );
      } catch (updateError: any) {
        logError(updateError, {
          ...context,
          additionalData: {
            ...context.additionalData,
            purchaseId,
            operation: 'update_email_failure_status'
          }
        });
      }
    }

  } catch (error: any) {
    // Email sending errors should not fail webhook processing
    logError(error, {
      ...context,
      additionalData: {
        ...context.additionalData,
        userEmail: purchaseRecord.userEmail,
        transactionId: purchaseRecord.stripeSessionId,
        purchaseId,
        operation: 'email_sending_process'
      }
    });

    // Update purchase record with email failure status
    try {
      await withDatabaseRetry(
        () => db.collection('purchases').doc(purchaseId).update({
          emailSent: false,
          emailError: error.message,
          emailAttemptedAt: new Date(),
          updatedAt: new Date()
        }),
        context
      );
    } catch (updateError: any) {
      logError(updateError, {
        ...context,
        additionalData: {
          ...context.additionalData,
          purchaseId,
          operation: 'update_email_error_status'
        }
      });
    }
  }
}

/**
 * Update user's premium status and purchase history
 */
async function updateUserPremiumStatus(userEmail: string, purchaseId: string, amount: number, context: any) {
  try {
    // Query for user by email
    const usersQuery = await db.collection('users')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (usersQuery.empty) {
      console.warn('⚠️ User not found for premium status update:', { 
        userEmail, 
        purchaseId,
        requestId: context.requestId 
      });
      return;
    }

    const userDoc = usersQuery.docs[0];
    const userData = userDoc.data();
    
    // Update user with premium status and purchase history
    const updateData = {
      premium: true,
      lastPurchaseDate: new Date(),
      totalSpent: (userData.totalSpent || 0) + amount,
      purchaseHistory: [
        ...(userData.purchaseHistory || []),
        purchaseId
      ],
      updatedAt: new Date(),
    };

    await userDoc.ref.update(updateData);
    
    console.log('✅ User premium status updated:', {
      userId: userDoc.id,
      userEmail,
      purchaseId,
      totalSpent: updateData.totalSpent,
      requestId: context.requestId,
    });

  } catch (error: any) {
    throw createAppError(
      `Failed to update user premium status: ${error.message}`,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      500,
      'Failed to update user account',
      {
        userEmail,
        purchaseId,
        amount,
        operation: 'update_user_premium_status'
      },
      true
    );
  }
}

/**
 * Check if webhook event has already been processed (idempotency)
 */
async function checkIdempotency(idempotencyKey: string) {
  try {
    const doc = await db.collection('webhook_processing')
      .doc(idempotencyKey)
      .get();
    
    if (doc.exists) {
      const data = doc.data();
      return {
        processedAt: data?.processedAt,
        status: data?.status,
        eventId: data?.eventId,
      };
    }
    
    return null;
  } catch (error: any) {
    console.error('Failed to check idempotency:', {
      idempotencyKey,
      error: error.message,
    });
    return null;
  }
}

/**
 * Mark webhook event as being processed
 */
async function markEventProcessing(idempotencyKey: string, eventId: string, eventType: string) {
  try {
    await db.collection('webhook_processing')
      .doc(idempotencyKey)
      .set({
        eventId,
        eventType,
        status: 'processing',
        startedAt: new Date(),
        processedAt: new Date(),
      });
  } catch (error: any) {
    console.error('Failed to mark event as processing:', {
      idempotencyKey,
      eventId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Mark webhook event as completed
 */
async function markEventCompleted(idempotencyKey: string, status: string, errorMessage?: string) {
  try {
    const updateData: any = {
      status,
      completedAt: new Date(),
      processedAt: new Date(),
    };
    
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }
    
    await db.collection('webhook_processing')
      .doc(idempotencyKey)
      .update(updateData);
  } catch (error: any) {
    console.error('Failed to mark event as completed:', {
      idempotencyKey,
      status,
      error: error.message,
    });
  }
}
