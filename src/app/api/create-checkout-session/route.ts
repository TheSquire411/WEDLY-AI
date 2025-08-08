
import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { createCheckoutSession } from '../../../../lib/stripeServer.js';
import { 
  createErrorResponse, 
  extractRequestContext, 
  validateRequired,
  createAppError,
  ErrorCategory,
  ErrorSeverity,
  withRetry
} from '../../../../lib/errorHandler';
import { 
  validateRequestBody, 
  ValidationSchemas,
  isValidEmail 
} from '../../../../lib/validation';
import { 
  withRateLimit, 
  RateLimitConfigs,
  getRateLimitHeaders 
} from '../../../../lib/rateLimiting';
import { 
  createSecureResponse,
  withSecurity,
  handlePreflight 
} from '../../../../lib/security';

// Handle preflight OPTIONS requests
export async function OPTIONS(request: Request) {
  return handlePreflight(request, 'api');
}

export async function POST(request: Request) {
  const context = extractRequestContext(request);
  context.endpoint = '/api/create-checkout-session';
  
  try {
    // Apply security middleware
    const securityResult = withSecurity({
      endpointType: 'api',
      requireOriginValidation: true,
      detectSuspicious: true,
    })(request, context);
    
    // Apply rate limiting for payment endpoints
    const rateLimitCheck = withRateLimit(RateLimitConfigs.payment, '/api/create-checkout-session');
    const rateLimitResult = rateLimitCheck(request, context);
    
    // Add rate limit headers to context
    context.rateLimitHeaders = getRateLimitHeaders(
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
      RateLimitConfigs.payment.maxRequests
    );
    // Verify Firebase ID token for authentication
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      throw createAppError(
        'Authorization header missing or invalid format',
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        401,
        'Authorization header is required. Please log in and try again.',
        { hasAuthorization: !!authorization }
      );
    }

    const idToken = authorization.split('Bearer ')[1];
    if (!idToken) {
      throw createAppError(
        'Bearer token missing from authorization header',
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        401,
        'Invalid authorization token format. Please log in again.',
        { authorizationFormat: authorization.substring(0, 20) + '...' }
      );
    }

    // Verify Firebase ID token with retry logic for network issues
    let decodedToken;
    try {
      decodedToken = await withRetry(
        () => auth().verifyIdToken(idToken),
        { maxAttempts: 2, baseDelay: 500 },
        context
      );
    } catch (authError: any) {
      throw createAppError(
        `Firebase token verification failed: ${authError.message}`,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        401,
        'Invalid or expired authentication token. Please log in again.',
        { 
          authErrorType: authError.constructor.name,
          authErrorCode: authError.code 
        }
      );
    }

    const userEmail = decodedToken.email;
    const userId = decodedToken.uid;

    // Validate required user information
    validateRequired(
      { userId, userEmail }, 
      ['userId', 'userEmail']
    );
    
    // Additional email validation
    if (!userEmail || !isValidEmail(userEmail)) {
      throw createAppError(
        'Invalid email format in Firebase token',
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM,
        400,
        'Invalid user email format. Please check your account.',
        { userEmail: userEmail?.substring(0, 5) + '...' }
      );
    }

    // Add user context for logging
    context.userId = userId;
    context.userEmail = userEmail;

    // Determine the origin for success/cancel URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    // Configure success and cancel URLs
    const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?payment_cancelled=true`;

    // Create checkout session for exactly $49.99 AUD with retry logic
    const session = await withRetry(
      () => createCheckoutSession({
        userEmail,
        successUrl,
        cancelUrl,
        metadata: {
          userId,
          userEmail,
          productName: 'Wedly Service',
          description: 'One-time payment for Wedly service access',
          requestId: context.requestId,
        },
      }),
      { 
        maxAttempts: 3, 
        baseDelay: 1000,
        retryableErrors: ['network', 'timeout', 'temporarily unavailable', 'rate limit']
      },
      context
    );

    if (!session?.id) {
      throw createAppError(
        'Checkout session creation returned empty session',
        ErrorCategory.PAYMENT,
        ErrorSeverity.HIGH,
        500,
        'Failed to create payment session. Please try again.',
        { sessionData: session }
      );
    }

    // Add session context for logging
    context.sessionId = session.id;

    console.log('✅ Checkout session created successfully:', {
      sessionId: session.id,
      userEmail,
      userId,
      requestId: context.requestId,
      url: session.url,
      amount: 4999,
      currency: 'aud'
    });

    // Create secure response with all security headers
    return createSecureResponse(
      { 
        sessionId: session.id,
        url: session.url,
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      },
      request,
      {
        status: 200,
        endpointType: 'api',
        additionalHeaders: context.rateLimitHeaders || {},
      }
    );

  } catch (error: any) {
    // Add additional context for payment-related errors
    if (error.message?.includes('stripe') || error.message?.includes('payment')) {
      context.additionalData = {
        ...context.additionalData,
        paymentFlow: 'checkout_session_creation',
        amount: 4999,
        currency: 'aud'
      };
    }

    return createErrorResponse(error, context);
  }
}
