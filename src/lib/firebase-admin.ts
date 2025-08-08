import * as admin from 'firebase-admin';

// Check if the service account JSON is available
const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable is not set. Firebase Admin SDK could not be initialized.');
  }

  try {
    // Get server configuration with Firebase Admin credentials
    const { firebaseAdmin } = serverConfig;

    // Validate required Firebase Admin configuration
    if (!firebaseAdmin.projectId) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is required for Firebase Admin SDK initialization');
    }

    if (!firebaseAdmin.clientEmail) {
      throw new Error('FIREBASE_CLIENT_EMAIL environment variable is required for Firebase Admin SDK initialization');
    }

    if (!firebaseAdmin.privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY environment variable is required for Firebase Admin SDK initialization');
    }

    // Validate private key format
    if (!firebaseAdmin.privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error('FIREBASE_PRIVATE_KEY appears to be malformed. Ensure it includes the full private key with headers.');
    }

    // Initialize Firebase Admin with individual environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseAdmin.projectId,
        clientEmail: firebaseAdmin.clientEmail,
        privateKey: firebaseAdmin.privateKey,
      }),
      projectId: firebaseAdmin.projectId,
    });

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    
    // Provide helpful error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('private key')) {
        console.error('Hint: Ensure FIREBASE_PRIVATE_KEY includes newline characters. In environment variables, use \\n for line breaks.');
      } else if (error.message.includes('client email')) {
        console.error('Hint: FIREBASE_CLIENT_EMAIL should be in the format: firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com');
      } else if (error.message.includes('project ID')) {
        console.error('Hint: FIREBASE_PROJECT_ID should match your Firebase project identifier');
      }
    }
    
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Lazy initialization - only initialize when needed
let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    initializeFirebaseAdmin();
    initialized = true;
  }
}

// Export Firebase Admin services with lazy initialization
export const auth = (() => {
  let authInstance: admin.auth.Auth | null = null;
  return () => {
    if (!authInstance) {
      try {
        ensureInitialized();
        authInstance = admin.auth();
      } catch (error) {
        console.error('Failed to get Firebase Auth instance:', error);
        throw new Error('Firebase Auth service is not available. Check Firebase Admin initialization.');
      }
    }
    return authInstance;
  };
})();

export const db = (() => {
  let dbInstance: admin.firestore.Firestore | null = null;
  return () => {
    if (!dbInstance) {
      try {
        ensureInitialized();
        dbInstance = admin.firestore();
      } catch (error) {
        console.error('Failed to get Firestore instance:', error);
        throw new Error('Firestore service is not available. Check Firebase Admin initialization.');
      }
    }
    return dbInstance;
  };
})();

/**
 * Utility function to verify Firebase Admin is properly initialized
 * @returns {boolean} True if Firebase Admin is initialized and ready
 */
export function isFirebaseAdminInitialized(): boolean {
  try {
    return admin.apps.length > 0 && admin.app().name === '[DEFAULT]';
  } catch (error) {
    return false;
  }
}

/**
 * Get Firebase Admin app instance with error handling
 * @returns {admin.app.App} Firebase Admin app instance
 * @throws {Error} If Firebase Admin is not initialized
 */
export function getFirebaseAdminApp(): admin.app.App {
  if (!isFirebaseAdminInitialized()) {
    throw new Error('Firebase Admin SDK is not initialized');
  }
  return admin.app();
}
