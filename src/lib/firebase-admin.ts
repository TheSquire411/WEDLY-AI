
import * as admin from 'firebase-admin';

// Check if the service account JSON is available
const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

let initialized = admin.apps.length > 0;

if (!initialized && serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

// A function to safely get the admin services
const getAdminService = <T>(getter: () => T, serviceName: string): T => {
  if (!initialized) {
    const errorMessage = `Firebase Admin SDK not initialized. ${serviceName} is unavailable. Ensure FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is set in your environment.`;
    // In a local/dev environment, it's better to throw an error than to return a mock
    // that hides the configuration issue.
    throw new Error(errorMessage);
  }
  return getter();
};

// Export the services
export const auth = getAdminService(() => admin.auth(), 'Authentication');
export const db = getAdminService(() => admin.firestore(), 'Firestore');
