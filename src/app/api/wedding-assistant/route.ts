
import { askWeddingAssistant } from '@/ai/flows/wedding-assistant';
import { NextRequest, NextResponse } from 'next/server';
import { 
  createErrorResponse, 
  extractRequestContext, 
  validateRequired,
  withRetry
} from '@/lib/errorHandler';
import { 
  validateRequestBody, 
  ValidationSchemas 
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

// Handle preflight OPTIONS requests
export async function OPTIONS(request: Request) {
  return handlePreflight(request, 'api');
}

export async function POST(req: NextRequest) {
  const context = extractRequestContext(req);
  context.endpoint = '/api/wedding-assistant';

  try {
    // Apply security middleware
    const securityResult = withSecurity({
      endpointType: 'api',
      requireOriginValidation: true,
      detectSuspicious: true,
    })(req, context);
    
    // Apply rate limiting for AI assistant endpoints
    const rateLimitCheck = withRateLimit(RateLimitConfigs.assistant, '/api/wedding-assistant');
    const rateLimitResult = rateLimitCheck(req, context);
    
    // Add rate limit headers to context
    context.rateLimitHeaders = getRateLimitHeaders(
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
      RateLimitConfigs.assistant.maxRequests
    );

    const body = await req.json();
    
    // Validate and sanitize request body
    const validatedData = validateRequestBody(body, ValidationSchemas.weddingAssistant, context);
    const { question, userId } = validatedData;

    // Add user context for logging
    context.userId = userId;
    context.additionalData = {
      questionLength: question?.length || 0,
      hasQuestion: !!question
    };

    console.log('🤖 Processing wedding assistant request:', {
      userId,
      questionLength: question.length,
      requestId: context.requestId
    });

    // Call wedding assistant with retry logic for network issues
    const result = await withRetry(
      () => askWeddingAssistant({ question, userId }),
      { 
        maxAttempts: 2, 
        baseDelay: 1000,
        retryableErrors: ['network', 'timeout', 'connection']
      },
      context
    );

    console.log('✅ Wedding assistant response generated:', {
      userId,
      responseLength: (result as any)?.response?.length || 0,
      requestId: context.requestId
    });

    // Create secure response with all security headers
    return createSecureResponse(
      {
        ...result,
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      },
      req,
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
