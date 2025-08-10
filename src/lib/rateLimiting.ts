/**
 * Rate Limiting Utilities
 * 
 * Provides rate limiting functionality for API endpoints to prevent abuse
 * and ensure system stability, especially for payment-related operations.
 * 
 * Requirements covered:
 * - 5.1: Rate limiting for payment endpoints
 * - 5.2: Prevent abuse and ensure system stability
 * - 7.4: Proper error handling for rate limit violations
 * - 7.5: Security measures against abuse
 */

import { createAppError, ErrorCategory, ErrorSeverity } from './errorHandler';

/**
 * Rate limit configuration interface
 */
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  keyGenerator?: (request: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;     // Don't count failed requests
}

/**
 * Rate limit entry interface
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

/**
 * In-memory rate limit store
 * In production, consider using Redis for distributed rate limiting
 */
class MemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Global rate limit store
const rateLimitStore = new MemoryRateLimitStore();

/**
 * Default key generator using IP address and user agent
 */
function defaultKeyGenerator(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a simple hash of IP + User Agent for basic fingerprinting
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * User-based key generator using Firebase UID from Authorization header
 */
function userBasedKeyGenerator(request: Request): string {
  const authorization = request.headers.get('Authorization');
  
  if (authorization?.startsWith('Bearer ')) {
    // Extract user info from JWT token (simplified - in production, decode properly)
    const token = authorization.split('Bearer ')[1];
    if (token) {
      // Use first 10 characters of token as identifier
      return `user:${token.substring(0, 10)}`;
    }
  }
  
  // Fallback to IP-based limiting
  return defaultKeyGenerator(request);
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: Request, 
  config: RateLimitConfig,
  endpoint: string
): { allowed: boolean; resetTime?: number; remaining?: number } {
  const now = Date.now();
  const key = `${endpoint}:${(config.keyGenerator || defaultKeyGenerator)(request)}`;
  
  let entry = rateLimitStore.get(key);
  
  // Initialize new entry if doesn't exist or window has expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: config.maxRequests - 1,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      resetTime: entry.resetTime,
      remaining: 0,
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    resetTime: entry.resetTime,
    remaining: config.maxRequests - entry.count,
  };
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(
  config: RateLimitConfig,
  endpoint: string
) {
  return function rateLimitMiddleware(request: Request, context?: any) {
    const result = checkRateLimit(request, config, endpoint);
    
    if (!result.allowed) {
      const resetTimeSeconds = Math.ceil((result.resetTime! - Date.now()) / 1000);
      
      throw createAppError(
        `Rate limit exceeded for endpoint ${endpoint}`,
        ErrorCategory.RATE_LIMIT,
        ErrorSeverity.MEDIUM,
        429,
        `Too many requests. Please try again in ${resetTimeSeconds} seconds.`,
        {
          endpoint,
          resetTime: result.resetTime,
          resetTimeSeconds,
          windowMs: config.windowMs,
          maxRequests: config.maxRequests,
          ...context
        }
      );
    }
    
    return {
      remaining: result.remaining!,
      resetTime: result.resetTime!,
    };
  };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // Payment endpoints - very strict (critical security)
  payment: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,            // 5 requests per 15 minutes
    keyGenerator: userBasedKeyGenerator,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  } as RateLimitConfig,
  
  // Webhook endpoints - moderate (Stripe may retry)
  webhook: {
    windowMs: 1 * 60 * 1000,   // 1 minute
    maxRequests: 10,           // 10 requests per minute
    keyGenerator: defaultKeyGenerator,
    skipSuccessfulRequests: true, // Don't count successful webhook processing
    skipFailedRequests: false,
  } as RateLimitConfig,
  
  // General API endpoints - lenient
  general: {
    windowMs: 1 * 60 * 1000,   // 1 minute
    maxRequests: 60,           // 60 requests per minute
    keyGenerator: userBasedKeyGenerator,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  } as RateLimitConfig,
  
  // Admin endpoints - very strict (high security)
  admin: {
    windowMs: 5 * 60 * 1000,   // 5 minutes
    maxRequests: 3,            // 3 requests per 5 minutes
    keyGenerator: userBasedKeyGenerator,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  } as RateLimitConfig,
  
  // AI assistant endpoints - moderate (resource intensive)
  assistant: {
    windowMs: 1 * 60 * 1000,   // 1 minute
    maxRequests: 20,           // 20 requests per minute
    keyGenerator: userBasedKeyGenerator,
    skipSuccessfulRequests: false,
    skipFailedRequests: true, // Don't penalize for failed AI requests
  } as RateLimitConfig,
  
  // Authentication endpoints - strict
  auth: {
    windowMs: 5 * 60 * 1000,   // 5 minutes
    maxRequests: 10,           // 10 requests per 5 minutes
    keyGenerator: defaultKeyGenerator, // IP-based for auth attempts
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  } as RateLimitConfig,
  
  // Suspicious activity - very strict
  suspicious: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 1,            // 1 request per hour
    keyGenerator: defaultKeyGenerator,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  } as RateLimitConfig,
} as const;

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  maxRequests: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
  };
}

/**
 * Clean up rate limit store (for testing or shutdown)
 */
export function cleanupRateLimitStore(): void {
  rateLimitStore.destroy();
}

/**
 * Rate limit decorator for API route handlers
 */
export function rateLimit(config: RateLimitConfig, endpoint: string) {
  return function decorator(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    
    descriptor.value = async function (request: Request, ...args: any[]) {
      const rateLimitCheck = withRateLimit(config, endpoint);
      const rateLimitResult = rateLimitCheck(request);
      
      // Add rate limit headers to context if available
      const context = args.find(arg => arg && typeof arg === 'object' && arg.requestId);
      if (context) {
        context.rateLimitHeaders = getRateLimitHeaders(
          rateLimitResult.remaining,
          rateLimitResult.resetTime,
          config.maxRequests
        );
      }
      
      return method.apply(this, [request, ...args]);
    };
    
    return descriptor;
  };
}

/**
 * Check if request is from a trusted source (for webhook rate limiting)
 */
export function isTrustedSource(request: Request): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const forwarded = request.headers.get('x-forwarded-for') || '';
  
  // Stripe webhook user agent pattern
  if (userAgent.includes('Stripe/')) {
    return true;
  }
  
  // Add other trusted sources as needed
  // For example, specific IP ranges, other service user agents, etc.
  
  return false;
}

/**
 * Adaptive rate limiting based on request source
 */
export function getAdaptiveRateLimit(request: Request, baseConfig: RateLimitConfig): RateLimitConfig {
  if (isTrustedSource(request)) {
    // More lenient for trusted sources
    return {
      ...baseConfig,
      maxRequests: baseConfig.maxRequests * 2,
    };
  }
  
  return baseConfig;
}