import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { 
  createErrorResponse, 
  extractRequestContext, 
  createAppError,
  ErrorCategory,
  ErrorSeverity,
  withRetry
} from '../../../../lib/errorHandler';
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
  context.endpoint = '/api/set-admin';

  try {
    // Apply security middleware
    const securityResult = withSecurity({
      endpointType: 'api',
      requireOriginValidation: true,
      detectSuspicious: true,
    })(request, context);
    
    // Apply strict rate limiting for admin endpoints
    const rateLimitCheck = withRateLimit(RateLimitConfigs.admin, '/api/set-admin');
    const rateLimitResult = rateLimitCheck(request, context);
    
    // Add rate limit headers to context
    context.rateLimitHeaders = getRateLimitHeaders(
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
      RateLimitConfigs.admin.maxRequests
    );
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

    // Verify Firebase ID token with retry logic
    const decodedToken = await withRetry(
      () => auth().verifyIdToken(idToken),
      { maxAttempts: 2, baseDelay: 500 },
      context
    );

    const userId = (decodedToken as any).uid;
    const userEmail = (decodedToken as any).email;

    if (!userId) {
      throw createAppError(
        'User ID not found in decoded token',
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        404,
        'User not found. Please log in again.',
        { hasDecodedToken: !!decodedToken }
      );
    }

    // Add user context for logging
    context.userId = userId;
    context.userEmail = userEmail;

    console.log('🔐 Setting admin claim for user:', {
      userId,
      userEmail,
      requestId: context.requestId
    });

    // Set admin claim with retry logic
    await withRetry(
      () => auth().setCustomUserClaims(userId, { isAdmin: true }),
      { 
        maxAttempts: 2, 
        baseDelay: 1000,
        retryableErrors: ['network', 'timeout', 'connection', 'unavailable']
      },
      context
    );

    console.log('✅ Admin claim set successfully:', {
      userId,
      userEmail,
      requestId: context.requestId
    });

    // Create secure response with all security headers
    return createSecureResponse(
      { 
        message: 'Admin claim set successfully.',
        userId,
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
    return createErrorResponse(error, context);
  }
}
