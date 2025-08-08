/**
 * Centralized Error Handling System
 * 
 * This module provides comprehensive error handling utilities for the Stripe payment system,
 * including error classification, logging, retry logic, and consistent API responses.
 * 
 * Requirements covered:
 * - 7.1: Detailed error logging for debugging and monitoring
 * - 7.2: Appropriate HTTP status codes and user-friendly error messages
 * - 7.3: Network timeout and retry logic handling
 * - 7.4: Database operation error recovery
 * - 7.5: System stability and data corruption prevention
 */

import { NextResponse } from 'next/server';

/**
 * Error severity levels for logging and monitoring
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for classification and handling
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  PAYMENT = 'payment',
  DATABASE = 'database',
  EMAIL = 'email',
  NETWORK = 'network',
  CONFIGURATION = 'configuration',
  RATE_LIMIT = 'rate_limit',
  WEBHOOK = 'webhook',
  INTERNAL = 'internal'
}

/**
 * Standardized error interface
 */
export interface AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  statusCode: number;
  userMessage: string;
  context?: Record<string, any>;
  retryable?: boolean;
  timestamp: Date;
  requestId?: string;
}

/**
 * Error logging context interface
 */
export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  sessionId?: string;
  transactionId?: string;
  rateLimitHeaders?: Record<string, string>;
  additionalData?: Record<string, any>;
}

/**
 * Retry configuration interface
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Default retry configuration for database operations
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ECONNREFUSED',
    'timeout',
    'network',
    'temporary',
    'unavailable'
  ]
};

/**
 * Create a standardized application error
 */
export function createAppError(
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity,
  statusCode: number,
  userMessage: string,
  context?: Record<string, any>,
  retryable: boolean = false
): AppError {
  const error = new Error(message) as AppError;
  error.category = category;
  error.severity = severity;
  error.statusCode = statusCode;
  error.userMessage = userMessage;
  error.context = context;
  error.retryable = retryable;
  error.timestamp = new Date();
  
  return error;
}

/**
 * Classify error based on message and type
 */
export function classifyError(error: any): { category: ErrorCategory; severity: ErrorSeverity; statusCode: number; userMessage: string; retryable: boolean } {
  const message = error.message?.toLowerCase() || '';
  const type = error.type?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('authentication') || 
      message.includes('invalid token') || message.includes('expired token') ||
      type.includes('auth') || code.includes('auth')) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      statusCode: 401,
      userMessage: 'Authentication required. Please log in and try again.',
      retryable: false
    };
  }

  // Authorization errors
  if (message.includes('forbidden') || message.includes('permission') || 
      message.includes('access denied') || code.includes('permission')) {
    return {
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      statusCode: 403,
      userMessage: 'You do not have permission to perform this action.',
      retryable: false
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || 
      message.includes('required') || message.includes('missing') ||
      type.includes('validation') || code.includes('invalid')) {
    return {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      statusCode: 400,
      userMessage: 'Invalid request. Please check your input and try again.',
      retryable: false
    };
  }

  // Payment errors
  if (message.includes('payment') || message.includes('stripe') || 
      message.includes('checkout') || message.includes('card') ||
      type.includes('stripe') || type.includes('payment')) {
    return {
      category: ErrorCategory.PAYMENT,
      severity: ErrorSeverity.HIGH,
      statusCode: 400,
      userMessage: 'Payment processing failed. Please try again or use a different payment method.',
      retryable: true
    };
  }

  // Database errors
  if (message.includes('database') || message.includes('firestore') || 
      message.includes('firebase') || message.includes('connection') ||
      code.includes('db') || code.includes('connection')) {
    return {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      statusCode: 503,
      userMessage: 'Service temporarily unavailable. Please try again in a moment.',
      retryable: true
    };
  }

  // Network errors
  if (message.includes('network') || message.includes('timeout') || 
      message.includes('econnreset') || message.includes('etimedout') ||
      code.includes('network') || code.includes('timeout')) {
    return {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      statusCode: 503,
      userMessage: 'Network error. Please check your connection and try again.',
      retryable: true
    };
  }

  // Rate limiting errors
  if (message.includes('rate limit') || message.includes('too many requests') ||
      type.includes('ratelimit') || code.includes('rate')) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      statusCode: 429,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      retryable: true
    };
  }

  // Email errors
  if (message.includes('email') || message.includes('smtp') || 
      message.includes('nodemailer') || type.includes('email')) {
    return {
      category: ErrorCategory.EMAIL,
      severity: ErrorSeverity.LOW,
      statusCode: 500,
      userMessage: 'Email service temporarily unavailable. Your request was processed successfully.',
      retryable: true
    };
  }

  // Webhook errors
  if (message.includes('webhook') || message.includes('signature') ||
      type.includes('webhook')) {
    return {
      category: ErrorCategory.WEBHOOK,
      severity: ErrorSeverity.HIGH,
      statusCode: 400,
      userMessage: 'Webhook processing failed.',
      retryable: false
    };
  }

  // Configuration errors
  if (message.includes('configuration') || message.includes('config') || 
      message.includes('environment') || message.includes('missing key')) {
    return {
      category: ErrorCategory.CONFIGURATION,
      severity: ErrorSeverity.CRITICAL,
      statusCode: 500,
      userMessage: 'Service configuration error. Please try again later.',
      retryable: false
    };
  }

  // Default to internal error
  return {
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.HIGH,
    statusCode: 500,
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: false
  };
}

/**
 * Log error with comprehensive context and structured format
 */
export function logError(error: Error | AppError, context?: ErrorContext): void {
  const isAppError = 'category' in error;
  const classification = isAppError ? 
    { category: error.category, severity: error.severity } : 
    classifyError(error);

  const logData = {
    // Error details
    message: error.message,
    stack: error.stack,
    name: error.name,
    
    // Classification
    category: classification.category,
    severity: classification.severity,
    
    // Context
    timestamp: new Date().toISOString(),
    requestId: context?.requestId,
    userId: context?.userId,
    userEmail: context?.userEmail,
    endpoint: context?.endpoint,
    method: context?.method,
    userAgent: context?.userAgent,
    ip: context?.ip,
    sessionId: context?.sessionId,
    transactionId: context?.transactionId,
    
    // Additional data
    ...(isAppError && error.context ? { errorContext: error.context } : {}),
    ...(context?.additionalData ? { additionalData: context.additionalData } : {}),
  };

  // Log with appropriate level based on severity
  switch (classification.severity) {
    case ErrorSeverity.CRITICAL:
      console.error('🚨 CRITICAL ERROR:', logData);
      break;
    case ErrorSeverity.HIGH:
      console.error('❌ HIGH SEVERITY ERROR:', logData);
      break;
    case ErrorSeverity.MEDIUM:
      console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
      break;
    case ErrorSeverity.LOW:
      console.info('ℹ️ LOW SEVERITY ERROR:', logData);
      break;
    default:
      console.error('ERROR:', logData);
  }

  // In production, you might want to send critical errors to external monitoring
  if (classification.severity === ErrorSeverity.CRITICAL) {
    // TODO: Send to external monitoring service (e.g., Sentry, DataDog)
    // sendToMonitoring(logData);
  }
}

/**
 * Create standardized API error response
 */
export function createErrorResponse(error: Error | AppError, context?: ErrorContext): NextResponse {
  const isAppError = 'category' in error;
  
  if (!isAppError) {
    const classification = classifyError(error);
    const appError = createAppError(
      error.message,
      classification.category,
      classification.severity,
      classification.statusCode,
      classification.userMessage,
      context?.additionalData,
      classification.retryable
    );
    appError.requestId = context?.requestId;
    
    logError(appError, context);
    
    return NextResponse.json(
      {
        error: appError.userMessage,
        code: appError.category,
        requestId: context?.requestId,
        timestamp: appError.timestamp.toISOString(),
        retryable: appError.retryable
      },
      { status: appError.statusCode }
    );
  }

  // Log the error
  logError(error, context);

  return NextResponse.json(
    {
      error: error.userMessage,
      code: error.category,
      requestId: context?.requestId || error.requestId,
      timestamp: error.timestamp.toISOString(),
      retryable: error.retryable
    },
    { status: error.statusCode }
  );
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: ErrorContext
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // Log successful retry if it wasn't the first attempt
      if (attempt > 1) {
        console.log(`✅ Operation succeeded on attempt ${attempt}/${retryConfig.maxAttempts}`, {
          requestId: context?.requestId,
          endpoint: context?.endpoint,
          attempt,
          totalAttempts: retryConfig.maxAttempts
        });
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = retryConfig.retryableErrors.some(retryableError =>
        error.message?.toLowerCase().includes(retryableError.toLowerCase()) ||
        error.code?.toLowerCase().includes(retryableError.toLowerCase()) ||
        error.type?.toLowerCase().includes(retryableError.toLowerCase())
      );

      // If this is the last attempt or error is not retryable, throw
      if (attempt === retryConfig.maxAttempts || !isRetryable) {
        console.error(`❌ Operation failed after ${attempt} attempts`, {
          error: error.message,
          requestId: context?.requestId,
          endpoint: context?.endpoint,
          attempt,
          totalAttempts: retryConfig.maxAttempts,
          isRetryable
        });
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
        retryConfig.maxDelay
      );

      console.warn(`⏳ Operation failed on attempt ${attempt}/${retryConfig.maxAttempts}, retrying in ${delay}ms`, {
        error: error.message,
        requestId: context?.requestId,
        endpoint: context?.endpoint,
        attempt,
        delay,
        isRetryable
      });

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Database operation wrapper with retry logic
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  return withRetry(
    operation,
    {
      maxAttempts: 2, // Only retry once for database operations
      baseDelay: 1000,
      retryableErrors: [
        'timeout',
        'connection',
        'network',
        'unavailable',
        'temporary',
        'econnreset',
        'etimedout'
      ]
    },
    context
  );
}

/**
 * Extract request context from Next.js request
 */
export function extractRequestContext(request: Request): ErrorContext {
  return {
    requestId: request.headers.get('x-request-id') || generateRequestId(),
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown'
  };
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate required fields and throw validation error if missing
 */
export function validateRequired(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw createAppError(
      `Missing required fields: ${missingFields.join(', ')}`,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      400,
      `Please provide the following required information: ${missingFields.join(', ')}`,
      { missingFields, providedFields: Object.keys(data) }
    );
  }
}

/**
 * Sanitize error message for user display (remove sensitive information)
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove potential sensitive information from error messages
  return message
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[card]')
    .replace(/\bsk_[a-zA-Z0-9_]+/g, '[stripe_key]')
    .replace(/\bpk_[a-zA-Z0-9_]+/g, '[stripe_key]')
    .replace(/\bwhsec_[a-zA-Z0-9_]+/g, '[webhook_secret]')
    .replace(/\b[A-Za-z0-9+/]{40,}={0,2}\b/g, '[token]');
}

export default {
  createAppError,
  classifyError,
  logError,
  createErrorResponse,
  withRetry,
  withDatabaseRetry,
  extractRequestContext,
  validateRequired,
  sanitizeErrorMessage,
  ErrorSeverity,
  ErrorCategory
};