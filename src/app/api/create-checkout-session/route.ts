
import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server';
import { createCheckoutSession } from '@/lib/stripeServer';
import { 
  createErrorResponse, 
  extractRequestContext, 
  validateRequired,
  createAppError,
  ErrorCategory,
  ErrorSeverity,
  withRetry
} from '@/lib/errorHandler';
import { 
  validateRequestBody, 
  ValidationSchemas,
  isValidEmail 
} from '@/lib/validation';
import { 
  withRateLimit, 
  RateLimitConfigs,
  getRateLimitHeaders 
} from '@/lib/rateLimiting';
import { 
  createSecureResponse,
  withSecurity,
  handlePreflight 
} from '@/lib/security';
import { DecodedIdToken } from 'firebase-admin/auth';

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
    const authResult = await verifyAuthToken(request);
    if (authResult.error) {
      throw createAppError(
        `Firebase token verification failed: ${authResult.error}`,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        401,
        'Invalid or expired authentication token. Please log in again.',
        { authError: authResult.error }
      );
    }

    if (!authResult.user) {
      throw createAppError(
        `Authentication failed: User object is null`,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        401,
        'Authentication failed. User data not found.',
        { authResult }
      );
    }
    const decodedToken: DecodedIdToken = authResult.user as DecodedIdToken;
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
