
import * as admin from 'firebase-admin';

// Check if the service account JSON is set
const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length && serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } catch(error) {
    console.error("Firebase admin initialization error", error);
    // Don't re-throw, let the app run, but some features will be disabled.
  }
}

function getAuth() {
  if (!admin.apps.length) {
    console.warn("Firebase Admin SDK not initialized. Auth features will be disabled.");
    // Return a mock auth object or handle appropriately
    return {
      verifyIdToken: async () => { throw new Error("Admin SDK not initialized"); }
    } as any;
  }
  return admin.auth();
}

function getDb() {
    if (!admin.apps.length) {
    console.warn("Firebase Admin SDK not initialized. DB features will be disabled.");
    // Return a mock db object
    return {
      collection: () => ({
        doc: () => ({
            update: async () => {},
            collection: () => ({
                doc: () => ({
                    get: async () => ({exists: false, data: () => ({})}),
                }),
                where: () => ({
                    get: async () => ({docs: [], size: 0}),
                })
            })
        }),
      }),
    } as any;
  }
  return admin.firestore();
}


export const auth = getAuth();
export const db = getDb();
