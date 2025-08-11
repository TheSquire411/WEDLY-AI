/**
 * Next.js Middleware for Security and CORS
 * 
 * Provides global security headers, CORS handling, and request validation
 * at the edge before requests reach API routes.
 * 
 * Requirements covered:
 * - 7.4: Security headers and validation
 * - 7.5: Proper CORS configuration
 * - 5.1: Security measures for all endpoints
 * - 5.2: Protection against common attacks
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Security headers to apply globally
 */
const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Remove server information
  'X-Powered-By': '',
  
  // Content Security Policy (basic - more specific CSP in Next.js config)
  'Content-Security-Policy': "frame-ancestors 'none';",
} as const;

/**
 * CORS configuration
 */
const corsConfig = {
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
    ],
  },
  production: {
    allowedOrigins: [
      'https://wedly.vercel.app',
      'https://wedly.com',
      // Add your production domains
    ],
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
  },
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  
  return allowedOrigins.includes(origin) || 
         (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost'));
}

/**
 * Apply CORS headers
 */
function applyCorsHeaders(response: NextResponse, request: NextRequest): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const config = isDevelopment ? corsConfig.development : corsConfig.production;
  const origin = request.headers.get('origin');
  
  // Set CORS headers
  if (origin && isOriginAllowed(origin, config.allowedOrigins)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Apply security headers
 */
function applySecurityHeaders(response: NextResponse): void {
  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
}

/**
 * Detect suspicious request patterns
 */
function detectSuspiciousActivity(request: NextRequest): { suspicious: boolean; severity: 'low' | 'medium' | 'high'; reasons: string[] } {
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';
  
  // Check for security scanner user agents (high severity)
  const scannerPatterns = [
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
    /acunetix/i,
    /netsparker/i,
    /appscan/i,
  ];
  
  if (scannerPatterns.some(pattern => pattern.test(userAgent))) {
    reasons.push('Security scanner user agent detected');
    severity = 'high';
  }
  
  // Check for bot user agents (medium severity)
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /java/i,
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    reasons.push('Bot-like user agent detected');
    if (severity === 'low') severity = 'medium';
  }
  
  // Check for suspicious paths (high severity)
  const suspiciousPaths = [
    /\/\.env/,
    /\/\.git/,
    /\/admin/,
    /\/phpmyadmin/i,
    /\/wp-admin/i,
    /\/wp-login/i,
    /\/config/,
    /\/backup/,
    /\/database/,
    /\/sql/,
    /\/shell/,
    /\/cmd/,
    /\/eval/,
    /\/etc\/passwd/,
    /\/proc\/self\/environ/,
    /\/windows\/system32/i,
  ];
  
  if (suspiciousPaths.some(pattern => pattern.test(pathname))) {
    reasons.push('Suspicious path access attempt');
    severity = 'high';
  }
  
  // Check for injection patterns in URL (high severity)
  const injectionPatterns = [
    /(\bunion\b.*\bselect\b)/i,
    /(\bselect\b.*\bfrom\b)/i,
    /(script.*alert)/i,
    /(javascript:)/i,
    /(<script|<iframe|<object)/i,
    /(\.\.\/|\.\.\\)/,
    /(%2e%2e%2f|%2e%2e%5c)/i,
  ];
  
  const fullUrl = request.url;
  if (injectionPatterns.some(pattern => pattern.test(fullUrl))) {
    reasons.push('Injection pattern detected in URL');
    severity = 'high';
  }
  
  // Check for missing or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    reasons.push('Missing or suspicious user agent');
    if (severity === 'low') severity = 'medium';
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
      if (severity === 'low') severity = 'medium';
    }
  }
  
  // Log suspicious activity
  if (reasons.length > 0) {
    console.warn(`🚨 Suspicious activity detected (${severity} severity):`, {
      reasons,
      pathname,
      userAgent: userAgent.substring(0, 100),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      timestamp: new Date().toISOString(),
      severity,
    });
  }
  
  return {
    suspicious: reasons.length > 0,
    severity,
    reasons,
  };
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Detect and log suspicious activity
  const suspiciousCheck = detectSuspiciousActivity(request);
  
  // Block high-severity threats
  if (suspiciousCheck.suspicious && suspiciousCheck.severity === 'high') {
    console.error('🚫 Blocking high-severity suspicious request:', {
      pathname,
      reasons: suspiciousCheck.reasons,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      timestamp: new Date().toISOString(),
    });
    
    // Return 403 Forbidden for high-severity threats
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // For medium severity, add additional security headers but allow request
  if (suspiciousCheck.suspicious && suspiciousCheck.severity === 'medium') {
    // Log for monitoring but continue processing
    console.warn('⚠️ Medium-severity suspicious activity - monitoring:', {
      pathname,
      reasons: suspiciousCheck.reasons,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Handle preflight OPTIONS requests for API routes
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const response = new NextResponse(null, { status: 200 });
    applyCorsHeaders(response, request);
    applySecurityHeaders(response);
    return response;
  }
  
  // Create response
  const response = NextResponse.next();
  
  // Apply security headers to all responses
  applySecurityHeaders(response);
  
  // Apply CORS headers to API routes
  if (pathname.startsWith('/api/')) {
    applyCorsHeaders(response, request);
    
    // Additional security for API routes
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    
    // Cache control for API responses
    if (!pathname.includes('/webhooks/')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
  
  // Special handling for webhook endpoints
  if (pathname.startsWith('/api/webhooks/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
  
  // Add security headers for static assets
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }
  
  return response;
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
  ],
};