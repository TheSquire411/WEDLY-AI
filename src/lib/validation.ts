/**
 * Input Validation and Security Utilities
 * 
 * Provides comprehensive input validation, sanitization, and security checks
 * for API endpoints to prevent injection attacks and ensure data integrity.
 * 
 * Requirements covered:
 * - 5.1: Input validation for all API endpoints
 * - 5.2: Security validation and sanitization
 * - 7.4: Proper error handling for validation failures
 * - 7.5: Security headers and validation
 */

import { createAppError, ErrorCategory, ErrorSeverity } from './errorHandler';

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// URL validation regex
const URL_REGEX = /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/;

// Firebase UID validation (28 characters, alphanumeric)
const FIREBASE_UID_REGEX = /^[a-zA-Z0-9]{28}$/;

// Stripe ID patterns
const STRIPE_SESSION_ID_REGEX = /^cs_[a-zA-Z0-9_]+$/;
const STRIPE_PAYMENT_INTENT_REGEX = /^pi_[a-zA-Z0-9_]+$/;
const STRIPE_CUSTOMER_ID_REGEX = /^cus_[a-zA-Z0-9_]+$/;

// Common validation limits
const VALIDATION_LIMITS = {
  EMAIL_MAX_LENGTH: 254,
  URL_MAX_LENGTH: 2048,
  TEXT_MAX_LENGTH: 10000,
  QUESTION_MAX_LENGTH: 5000,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  METADATA_KEY_MAX_LENGTH: 50,
  METADATA_VALUE_MAX_LENGTH: 500,
} as const;

/**
 * Validation schema interface
 */
export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'firebaseUid' | 'stripeSessionId' | 'stripePaymentIntent' | 'stripeCustomerId' | 'object' | 'array';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
    sanitize?: boolean;
    customValidator?: (value: any) => boolean | string;
  };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

/**
 * Validate and sanitize input data against a schema
 */
export function validateInput(data: any, schema: ValidationSchema): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Input data must be an object'],
    };
  }

  // Validate each field in the schema
  for (const [fieldName, rules] of Object.entries(schema)) {
    const value = data[fieldName];
    const fieldErrors = validateField(fieldName, value, rules);
    
    if (fieldErrors.length > 0) {
      errors.push(...fieldErrors);
    } else {
      // Sanitize the value if validation passed
      sanitizedData[fieldName] = rules.sanitize ? sanitizeValue(value, rules.type) : value;
    }
  }

  // Check for unexpected fields (prevent injection)
  const allowedFields = Object.keys(schema);
  const providedFields = Object.keys(data);
  const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
}

/**
 * Validate a single field against its rules
 */
function validateField(fieldName: string, value: any, rules: ValidationSchema[string]): string[] {
  const errors: string[] = [];

  // Check required fields
  if (rules.required && (value === undefined || value === null)) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  // Skip validation for optional undefined/null values
  if (!rules.required && (value === undefined || value === null)) {
    return errors;
  }

  // Check empty values
  if (!rules.allowEmpty && (value === '' || (Array.isArray(value) && value.length === 0))) {
    if (rules.required) {
      errors.push(`${fieldName} cannot be empty`);
    }
    return errors;
  }

  // Type validation
  switch (rules.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      
      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
      }
      
      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`);
      }
      break;

    case 'email':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      if (value.length > VALIDATION_LIMITS.EMAIL_MAX_LENGTH) {
        errors.push(`${fieldName} is too long`);
      }
      if (!EMAIL_REGEX.test(value)) {
        errors.push(`${fieldName} must be a valid email address`);
      }
      break;

    case 'url':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      if (value.length > VALIDATION_LIMITS.URL_MAX_LENGTH) {
        errors.push(`${fieldName} URL is too long`);
      }
      if (!URL_REGEX.test(value)) {
        errors.push(`${fieldName} must be a valid URL`);
      }
      break;

    case 'firebaseUid':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      if (!FIREBASE_UID_REGEX.test(value)) {
        errors.push(`${fieldName} must be a valid Firebase UID`);
      }
      break;

    case 'stripeSessionId':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      if (!STRIPE_SESSION_ID_REGEX.test(value)) {
        errors.push(`${fieldName} must be a valid Stripe session ID`);
      }
      break;

    case 'stripePaymentIntent':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      if (!STRIPE_PAYMENT_INTENT_REGEX.test(value)) {
        errors.push(`${fieldName} must be a valid Stripe payment intent ID`);
      }
      break;

    case 'stripeCustomerId':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      if (!STRIPE_CUSTOMER_ID_REGEX.test(value)) {
        errors.push(`${fieldName} must be a valid Stripe customer ID`);
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`${fieldName} must be a valid number`);
        break;
      }
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${fieldName} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${fieldName} must be no more than ${rules.max}`);
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`${fieldName} must be a boolean`);
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        errors.push(`${fieldName} must be an object`);
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`${fieldName} must be an array`);
      }
      break;
  }

  // Custom validation
  if (rules.customValidator && errors.length === 0) {
    const customResult = rules.customValidator(value);
    if (customResult !== true) {
      errors.push(typeof customResult === 'string' ? customResult : `${fieldName} failed custom validation`);
    }
  }

  return errors;
}

/**
 * Sanitize a value based on its type
 */
function sanitizeValue(value: any, type: string): any {
  switch (type) {
    case 'string':
    case 'email':
    case 'url':
    case 'firebaseUid':
    case 'stripeSessionId':
    case 'stripePaymentIntent':
    case 'stripeCustomerId':
      return typeof value === 'string' ? value.trim() : value;
    
    case 'number':
      return typeof value === 'number' ? value : parseFloat(value);
    
    case 'boolean':
      return Boolean(value);
    
    default:
      return value;
  }
}

/**
 * Validate request body and throw error if invalid
 */
export function validateRequestBody(body: any, schema: ValidationSchema, context?: any): any {
  const result = validateInput(body, schema);
  
  if (!result.isValid) {
    throw createAppError(
      `Input validation failed: ${result.errors.join(', ')}`,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      400,
      'Invalid input data provided',
      {
        validationErrors: result.errors,
        providedFields: body ? Object.keys(body) : [],
        ...context
      }
    );
  }
  
  return result.sanitizedData;
}

/**
 * Common validation schemas for API endpoints
 */
export const ValidationSchemas = {
  // Checkout session creation - no body validation needed, user info from auth token
  checkoutSession: {
    // Optional metadata validation if provided
    metadata: {
      required: false,
      type: 'object' as const,
      customValidator: (value: any) => {
        if (!value) return true;
        return typeof value === 'object' && !Array.isArray(value);
      }
    },
  } as ValidationSchema,

  // Wedding assistant request
  weddingAssistant: {
    question: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: VALIDATION_LIMITS.QUESTION_MAX_LENGTH,
      sanitize: true,
      customValidator: (value: string) => {
        // Check for potentially malicious content
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+=/i,
          /eval\(/i,
          /function\(/i,
          /\${/,
          /<%/,
          /%>/
        ];
        return !suspiciousPatterns.some(pattern => pattern.test(value));
      }
    },
    userId: {
      required: true,
      type: 'firebaseUid' as const,
    },
    // Optional context for better responses
    context: {
      required: false,
      type: 'object' as const,
      customValidator: (value: any) => {
        if (!value) return true;
        return typeof value === 'object' && !Array.isArray(value);
      }
    },
  } as ValidationSchema,

  // Admin claim setting - no body validation needed, user info from auth token
  setAdmin: {
    // Optional admin level specification
    adminLevel: {
      required: false,
      type: 'string' as const,
      pattern: /^(basic|full|super)$/,
      allowEmpty: false,
    },
  } as ValidationSchema,

  // Webhook validation - Stripe handles signature validation, but we validate structure
  stripeWebhook: {
    // Webhook body structure validation happens after signature verification
    // This is handled by the webhook processing logic
  } as ValidationSchema,

  // Email validation for various endpoints
  email: {
    email: {
      required: true,
      type: 'email' as const,
      sanitize: true,
    },
  } as ValidationSchema,

  // Generic user data validation
  userData: {
    name: {
      required: false,
      type: 'string' as const,
      minLength: 1,
      maxLength: VALIDATION_LIMITS.NAME_MAX_LENGTH,
      sanitize: true,
      customValidator: (value: string) => {
        if (!value) return true;
        // Only allow letters, spaces, hyphens, and apostrophes
        return /^[a-zA-Z\s\-']+$/.test(value);
      }
    },
    email: {
      required: true,
      type: 'email' as const,
      sanitize: true,
    },
    phone: {
      required: false,
      type: 'string' as const,
      pattern: /^\+?[\d\s\-\(\)]+$/,
      minLength: 10,
      maxLength: 20,
      sanitize: true,
    },
  } as ValidationSchema,

  // Purchase data validation
  purchaseData: {
    sessionId: {
      required: true,
      type: 'stripeSessionId' as const,
    },
    amount: {
      required: true,
      type: 'number' as const,
      min: 0,
      max: 1000000, // $10,000 max
    },
    currency: {
      required: true,
      type: 'string' as const,
      pattern: /^[A-Z]{3}$/,
      minLength: 3,
      maxLength: 3,
    },
  } as ValidationSchema,
} as const;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && 
         email.length <= VALIDATION_LIMITS.EMAIL_MAX_LENGTH && 
         EMAIL_REGEX.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  return typeof url === 'string' && 
         url.length <= VALIDATION_LIMITS.URL_MAX_LENGTH && 
         URL_REGEX.test(url);
}

/**
 * Validate Firebase UID format
 */
export function isValidFirebaseUid(uid: string): boolean {
  return typeof uid === 'string' && FIREBASE_UID_REGEX.test(uid);
}

/**
 * Validate Stripe session ID format
 */
export function isValidStripeSessionId(sessionId: string): boolean {
  return typeof sessionId === 'string' && STRIPE_SESSION_ID_REGEX.test(sessionId);
}

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, VALIDATION_LIMITS.TEXT_MAX_LENGTH); // Limit length
}

/**
 * Validate and sanitize metadata object
 */
export function validateMetadata(metadata: any): { [key: string]: string } {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  
  const sanitized: { [key: string]: string } = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    // Validate key
    if (typeof key !== 'string' || 
        key.length === 0 || 
        key.length > VALIDATION_LIMITS.METADATA_KEY_MAX_LENGTH) {
      continue;
    }
    
    // Validate and sanitize value
    if (typeof value === 'string' && 
        value.length <= VALIDATION_LIMITS.METADATA_VALUE_MAX_LENGTH) {
      sanitized[sanitizeString(key)] = sanitizeString(value);
    }
  }
  
  return sanitized;
}

/**
 * Validate request headers for security threats
 */
export function validateRequestHeaders(headers: Headers): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-host',
    'x-original-url',
    'x-rewrite-url',
    'x-forwarded-proto',
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
      issues.push('Bot-like user agent detected');
    }
  }
  
  // Validate Content-Type for POST requests
  const contentType = headers.get('content-type');
  if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
    issues.push(`Unexpected content type: ${contentType}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validate request size and structure
 */
export function validateRequestSize(request: Request, maxSize: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (isNaN(size) || size > maxSize) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check for SQL injection patterns in strings
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(--|\/\*|\*\/)/,
    /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\()/i,
    /(\b(WAITFOR|DELAY)\s+)/i,
    /(xp_|sp_)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns in strings
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src\s*=\s*["']?javascript:/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Comprehensive security validation for input strings
 */
export function validateInputSecurity(input: string): { safe: boolean; threats: string[] } {
  const threats: string[] = [];
  
  if (detectSQLInjection(input)) {
    threats.push('SQL injection pattern detected');
  }
  
  if (detectXSS(input)) {
    threats.push('XSS pattern detected');
  }
  
  // Check for path traversal
  if (input.includes('../') || input.includes('..\\')) {
    threats.push('Path traversal pattern detected');
  }
  
  // Check for command injection
  const commandPatterns = [
    /(\||&|;|`|\$\(|\${)/,
    /\b(rm|del|format|shutdown|reboot)\b/i,
  ];
  
  if (commandPatterns.some(pattern => pattern.test(input))) {
    threats.push('Command injection pattern detected');
  }
  
  return {
    safe: threats.length === 0,
    threats,
  };
}

/**
 * Rate limiting validation - check if request should be rate limited
 */
export function shouldRateLimit(request: Request): { shouldLimit: boolean; reason?: string } {
  const userAgent = request.headers.get('user-agent') || '';
  const origin = request.headers.get('origin');
  
  // More aggressive rate limiting for suspicious requests
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return {
      shouldLimit: true,
      reason: 'Suspicious user agent detected',
    };
  }
  
  // Rate limit requests without proper origin
  if (!origin && request.method === 'POST') {
    return {
      shouldLimit: true,
      reason: 'Missing origin header for POST request',
    };
  }
  
  return { shouldLimit: false };
}

/**
 * Comprehensive API endpoint validation
 * Combines all security checks into a single function
 */
export function validateAPIRequest(
  request: Request,
  options: {
    requireAuth?: boolean;
    validateBody?: boolean;
    schema?: ValidationSchema;
    maxSize?: number;
    endpoint?: string;
  } = {}
): {
  valid: boolean;
  errors: string[];
  securityThreats: string[];
  sanitizedData?: any;
} {
  const errors: string[] = [];
  const securityThreats: string[] = [];
  let sanitizedData: any = undefined;
  
  const {
    requireAuth = false,
    validateBody = false,
    schema,
    maxSize = 1024 * 1024, // 1MB
    endpoint = 'unknown',
  } = options;
  
  try {
    // 1. Validate request size
    if (!validateRequestSize(request, maxSize)) {
      errors.push('Request size exceeds maximum allowed');
    }
    
    // 2. Validate headers
    const headerValidation = validateRequestHeaders(request.headers);
    if (!headerValidation.valid) {
      errors.push(...headerValidation.issues);
    }
    
    // 3. Check for authentication if required
    if (requireAuth) {
      const authorization = request.headers.get('Authorization');
      if (!authorization?.startsWith('Bearer ')) {
        errors.push('Authorization header missing or invalid format');
      }
    }
    
    // 4. Validate request method
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    if (!allowedMethods.includes(request.method)) {
      errors.push(`HTTP method ${request.method} not allowed`);
    }
    
    // 5. Check rate limiting conditions
    const rateLimitCheck = shouldRateLimit(request);
    if (rateLimitCheck.shouldLimit) {
      errors.push(`Rate limiting triggered: ${rateLimitCheck.reason}`);
    }
    
    // 6. Validate body if required and schema provided
    if (validateBody && schema && request.method !== 'GET') {
      // Note: Body validation would need to be done after reading the request body
      // This is a placeholder for the validation structure
    }
    
    return {
      valid: errors.length === 0 && securityThreats.length === 0,
      errors,
      securityThreats,
      sanitizedData,
    };
    
  } catch (error: any) {
    errors.push(`Validation error: ${error.message}`);
    return {
      valid: false,
      errors,
      securityThreats,
    };
  }
}

/**
 * Validate Firebase ID token format (basic check before verification)
 */
export function validateFirebaseTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic JWT format check (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Check if each part is base64-like
  const base64Pattern = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => base64Pattern.test(part));
}

/**
 * Sanitize and validate JSON input
 */
export function validateJSONInput(input: any, maxDepth: number = 10): { valid: boolean; sanitized?: any; error?: string } {
  try {
    // Check for circular references and excessive depth
    const seen = new WeakSet();
    
    function checkDepth(obj: any, depth: number): boolean {
      if (depth > maxDepth) {
        return false;
      }
      
      if (obj && typeof obj === 'object') {
        if (seen.has(obj)) {
          return false; // Circular reference
        }
        seen.add(obj);
        
        if (Array.isArray(obj)) {
          return obj.every(item => checkDepth(item, depth + 1));
        } else {
          return Object.values(obj).every(value => checkDepth(value, depth + 1));
        }
      }
      
      return true;
    }
    
    if (!checkDepth(input, 0)) {
      return {
        valid: false,
        error: 'JSON structure too deep or contains circular references',
      };
    }
    
    // Basic sanitization - remove potentially dangerous properties
    function sanitizeObject(obj: any): any {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip potentially dangerous keys
        if (key.startsWith('__') || key.includes('prototype') || key.includes('constructor')) {
          continue;
        }
        
        sanitized[key] = sanitizeObject(value);
      }
      
      return sanitized;
    }
    
    return {
      valid: true,
      sanitized: sanitizeObject(input),
    };
    
  } catch (error: any) {
    return {
      valid: false,
      error: `JSON validation error: ${error.message}`,
    };
  }
}