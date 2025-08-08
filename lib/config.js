/**
 * Centralized Configuration System
 * 
 * This module provides a centralized way to manage environment variables
 * with proper separation between client-safe (public) and server-only variables.
 * 
 * Public variables are prefixed with NEXT_PUBLIC_ and can be safely accessed
 * on the client-side. Server variables contain sensitive data and should only
 * be accessed in server-side code (API routes, server components).
 */

/**
 * Public configuration - safe for client-side access
 * These variables are prefixed with NEXT_PUBLIC_ and will be included in the client bundle
 */
const publicConfig = {
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  unsplash: {
    accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
  },
};

/**
 * Server configuration - contains sensitive data, server-side only
 * These variables should never be accessed on the client-side
 */
const serverConfig = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  firebaseAdmin: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Handle Firebase private key newline character replacement
    // Environment variables can't contain actual newlines, so they're stored as \n
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
  unsplash: {
    secretKey: process.env.UNSPLASH_SECRET_KEY,
  },
};

/**
 * Validation function to check if required environment variables are present
 */
function validateConfig() {
  const errors = [];

  // Validate public config
  if (!publicConfig.stripe.publishableKey) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
  }

  if (!publicConfig.firebase.apiKey) {
    errors.push('NEXT_PUBLIC_FIREBASE_API_KEY is required');
  }

  if (!publicConfig.firebase.authDomain) {
    errors.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required');
  }

  if (!publicConfig.firebase.projectId) {
    errors.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
  }

  // Only validate server config if we're in a server environment
  if (typeof window === 'undefined') {
    if (!serverConfig.stripe.secretKey) {
      errors.push('STRIPE_SECRET_KEY is required');
    }

    if (!serverConfig.stripe.webhookSecret) {
      errors.push('STRIPE_WEBHOOK_SECRET is required');
    }

    if (!serverConfig.firebaseAdmin.projectId) {
      errors.push('FIREBASE_PROJECT_ID is required');
    }

    if (!serverConfig.firebaseAdmin.clientEmail) {
      errors.push('FIREBASE_CLIENT_EMAIL is required');
    }

    if (!serverConfig.firebaseAdmin.privateKey) {
      errors.push('FIREBASE_PRIVATE_KEY is required');
    }

    if (!serverConfig.email.host) {
      errors.push('EMAIL_HOST is required');
    }

    if (!serverConfig.email.user) {
      errors.push('EMAIL_USER is required');
    }

    if (!serverConfig.email.pass) {
      errors.push('EMAIL_PASS is required');
    }

    if (!serverConfig.email.from) {
      errors.push('EMAIL_FROM is required');
    }
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    // In development and build time, log errors but don't throw to allow for partial configuration
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
}

// Validate configuration on module load
validateConfig();

/**
 * Get public configuration (safe for client-side)
 * @returns {object} Public configuration object
 */
function getPublicConfig() {
  return publicConfig;
}

/**
 * Get server configuration (server-side only)
 * @returns {object} Server configuration object
 * @throws {Error} If called on client-side
 */
function getServerConfig() {
  if (typeof window !== 'undefined') {
    throw new Error('Server configuration cannot be accessed on the client-side');
  }
  return serverConfig;
}

/**
 * Get specific configuration value with fallback
 * @param {string} path - Dot notation path to the config value (e.g., 'stripe.publishableKey')
 * @param {any} fallback - Fallback value if not found
 * @param {boolean} isServer - Whether to access server config
 * @returns {any} Configuration value or fallback
 */
function getConfigValue(path, fallback = null, isServer = false) {
  const config = isServer ? getServerConfig() : getPublicConfig();
  const keys = path.split('.');
  let value = config;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return fallback;
    }
  }

  return value;
}

// ES6 exports for modern import syntax
export {
  publicConfig as public,
  serverConfig as server,
  getPublicConfig,
  getServerConfig,
  getConfigValue,
  validateConfig,
};

// Default export for backward compatibility
export default {
  public: publicConfig,
  server: serverConfig,
  getPublicConfig,
  getServerConfig,
  getConfigValue,
  validateConfig,
};