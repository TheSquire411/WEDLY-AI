/**
 * Security Headers and CORS Utilities
 * 
 * Provides security headers, CORS configuration, and other security measures
 * to protect the application from common web vulnerabilities.
 * 
 * Requirements covered:
 * - 7.4: Security headers and validation
 * - 7.5: Proper CORS configuration
 * - 5.1: Security measures for API endpoints
 * - 5.2: Protection against common attacks
 */

import { NextResponse } from 'next/server';

/**
 * Security headers configuration
 */
export const SecurityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://images.unsplash.com https://*.firebase.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
} as const;

/**
 * CORS configuration for different environments
 */
export const CorsConfig = {
  development: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'X-File-Name',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
  
  production: {
    allowedOrigins: [
      'https://wedly.vercel.app',
      'https://wedly.com',
      // Add your production domains here
    ],
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
  
  // Special configuration for webhook endpoints
  webhook: {
    allowedOrigins: [
      'https://api.stripe.com',
      // Add other webhook sources as needed
    ],
    allowedMethods: ['POST'],
    allowedHeaders: [
      'Content-Type',
      'Stripe-Signature',
      'User-Agent',
    ],
    credentials: false,
    maxAge: 0, // No caching for webhooks
  },
} as const;

/**
 * Get CORS configuration based on environment and endpoint type
 */
export function getCorsConfig(endpointType: 'api' | 'webhook' = 'api') {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (endpointType === 'webhook') {
    return CorsConfig.webhook;
  }
  
  return isDevelopment ? CorsConfig.development : CorsConfig.production;
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null, allowedOrigins: readonly string[]): boolean {
  if (!origin) {
    return false;
  }
  
  return allowedOrigins.includes(origin) || 
         allowedOrigins.includes('*') ||
         (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost'));
}

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  response: NextResponse,
  request: Request,
  endpointType: 'api' | 'webhook' = 'api'
): NextResponse {
  const corsConfig = getCorsConfig(endpointType);
  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  if (origin && isOriginAllowed(origin, corsConfig.allowedOrigins)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  // Set other CORS headers
  response.headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
  
  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply all security headers
  Object.entries(SecurityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  return response;
}

/**
 * Create a secure response with all headers applied
 */
export function createSecureResponse(
  data: any,
  request: Request,
  options: {
    status?: number;
    endpointType?: 'api' | 'webhook';
    additionalHeaders?: Record<string, string>;
  } = {}
): NextResponse {
  const { status = 200, endpointType = 'api', additionalHeaders = {} } = options;
  
  // Create response
  const response = NextResponse.json(data, { status });
  
  // Apply security headers
  applySecurityHeaders(response);
  
  // Apply CORS headers
  applyCorsHeaders(response, request, endpointType);
  
  // Apply additional headers
  Object.entries(additionalHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  return response;
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflight(request: Request, endpointType: 'api' | 'webhook' = 'api'): NextResponse {
  console.log('Handling preflight request for:', request.url);
  const origin = request.headers.get('origin');
  const corsConfig = getCorsConfig(endpointType);
  console.log('CORS config:', corsConfig);
  console.log('Request origin:', origin);

  const response = new NextResponse(null, { status: 200 });
  
  // Apply CORS headers for preflight
  applyCorsHeaders(response, request, endpointType);
  
  // Apply security headers
  applySecurityHeaders(response);
  
  console.log('Preflight response headers:', response.headers);
  return response;
}

/**
 * Validate request origin for sensitive operations
 */
export function validateRequestOrigin(request: Request, allowedOrigins?: string[]): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Use provided origins or get from CORS config
  const allowed = allowedOrigins || getCorsConfig('api').allowedOrigins;
  
  // Check origin header
  if (origin && isOriginAllowed(origin, allowed)) {
    return true;
  }
  
  // Check referer as fallback
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      return isOriginAllowed(refererOrigin, allowed);
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Check for suspicious request patterns
 */
export function detectSuspiciousActivity(request: Request): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const userAgent = request.headers.get('user-agent') || '';
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Check for missing or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    reasons.push('Missing or suspicious user agent');
  }
  
  // Check for bot patterns (basic detection)
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    reasons.push('Bot-like user agent detected');
  }
  
  // Check for origin/referer mismatch
  if (origin && referer) {
    try {
      const originUrl = new URL(origin);
      const refererUrl = new URL(referer);
      
      if (originUrl.host !== refererUrl.host) {
        reasons.push('Origin and referer mismatch');
      }
    } catch {
      reasons.push('Invalid origin or referer format');
    }
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-host',
    'x-original-url',
    'x-rewrite-url',
  ];
  
  for (const header of suspiciousHeaders) {
    if (request.headers.get(header)) {
      reasons.push(`Suspicious header detected: ${header}`);
    }
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Security middleware for API routes
 */
export function withSecurity(options: {
  endpointType?: 'api' | 'webhook';
  requireOriginValidation?: boolean;
  detectSuspicious?: boolean;
  validateHeaders?: boolean;
  maxRequestSize?: number;
  blockSuspicious?: boolean;
} = {}) {
  const {
    endpointType = 'api',
    requireOriginValidation = false,
    detectSuspicious = true,
    validateHeaders = true,
    maxRequestSize = 1024 * 1024, // 1MB default
    blockSuspicious = false,
  } = options;
  
  return function securityMiddleware(request: Request, context?: any) {
    const securityIssues: string[] = [];
    
    // Validate request size
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (isNaN(size) || size > maxRequestSize) {
        throw new Error(`Request size too large: ${size} bytes (max: ${maxRequestSize})`);
      }
    }
    
    // Validate headers if enabled
    if (validateHeaders) {
      const headerValidation = validateRequestHeaders(request.headers);
      if (!headerValidation.valid) {
        securityIssues.push(...headerValidation.issues);
      }
    }
    
    // Validate origin if required
    if (requireOriginValidation && !validateRequestOrigin(request)) {
      securityIssues.push('Invalid request origin');
      if (blockSuspicious) {
        throw new Error('Invalid request origin');
      }
    }
    
    // Detect suspicious activity
    if (detectSuspicious) {
      const suspiciousCheck = detectSuspiciousActivity(request);
      if (suspiciousCheck.suspicious) {
        securityIssues.push(...suspiciousCheck.reasons);
        
        console.warn('🚨 Suspicious activity detected:', {
          reasons: suspiciousCheck.reasons,
          userAgent: request.headers.get('user-agent'),
          origin: request.headers.get('origin'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          requestId: context?.requestId,
          endpoint: context?.endpoint,
        });
        
        // Block if configured to do so
        if (blockSuspicious && suspiciousCheck.reasons.length > 2) {
          throw new Error('Request blocked due to suspicious activity');
        }
        
        if (context) {
          context.suspiciousActivity = suspiciousCheck;
        }
      }
    }
    
    // Add security context
    if (context) {
      context.securityIssues = securityIssues;
      context.securityChecked = true;
    }
    
    return {
      endpointType,
      securityChecked: true,
      securityIssues,
      suspicious: securityIssues.length > 0,
    };
  };
}

/**
 * Validate request headers for security threats
 */
function validateRequestHeaders(headers: Headers): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-host',
    'x-original-url', 
    'x-rewrite-url',
  ];
  
  for (const header of suspiciousHeaders) {
    if (headers.get(header)) {
      issues.push(`Suspicious header detected: ${header}`);
    }
  }
  
  // Validate User-Agent
  const userAgent = headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    issues.push('Missing or suspicious user agent');
  }
  
  // Check for bot patterns (basic detection)
  if (userAgent) {
    const botPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /masscan/i,
      /nmap/i,
      /dirb/i,
      /dirbuster/i,
      /gobuster/i,
      /wfuzz/i,
      /burp/i,
    ];
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      issues.push('Security scanner user agent detected');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}