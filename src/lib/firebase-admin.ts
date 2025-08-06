
import * as admin from 'firebase-admin';

const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error("Firebase admin initialization error from service account JSON:", error);
    }
  } else {
    console.warn("FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is not set. Admin features will be disabled. Falling back to default credentials.");
    try {
      admin.initializeApp();
    } catch(error) {
        console.error("Firebase admin initialization error with default credentials:", error);
    }
  }
}

const getSafeService = <T>(getter: () => T, mock: T): T => {
    if (admin.apps.length > 0) {
        try {
            return getter();
        } catch (e) {
            console.error('Failed to get admin service, returning mock. Error:', e);
            return mock;
        }
    }
    // console.warn('Firebase Admin SDK not initialized. Returning mock service.');
    return mock;
};

export const auth = getSafeService(() => admin.auth(), {
  verifyIdToken: async () => { throw new Error("Admin SDK not initialized"); }
} as unknown as admin.auth.Auth);

export const db = getSafeService(() => admin.firestore(), {
  collection: () => ({
    doc: () => ({
        update: async () => {},
        get: async () => ({exists: false, data: () => ({})}),
        set: async () => {},
        collection: () => ({
            doc: () => ({
                get: async () => ({exists: false, data: () => ({})}),
                set: async () => {},
            }),
            where: () => ({
                get: async () => ({docs: [], size: 0}),
            })
        })
    }),
  }),
} as unknown as admin.firestore.Firestore);
