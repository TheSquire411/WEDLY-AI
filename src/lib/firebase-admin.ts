import * as admin from 'firebase-admin';

const ensureFirebaseAdminIsInitialized = () => {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable is not set. Firebase Admin SDK could not be initialized.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase admin initialization error from service account JSON:", error);
    throw new Error('Failed to initialize Firebase Admin SDK. Please check the service account credentials.');
  }
};

export const getAuth = () => {
  ensureFirebaseAdminIsInitialized();
  return admin.auth();
};

export const getDb = () => {
  ensureFirebaseAdminIsInitialized();
  return admin.firestore();
};
