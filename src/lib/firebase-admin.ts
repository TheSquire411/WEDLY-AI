
import * as admin from 'firebase-admin';

// Check if the service account JSON is set
const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

let app: admin.app.App;

if (!admin.apps.length) {
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error("Firebase admin initialization error:", error);
      // We are not re-throwing the error, so the app can start, but some features will be disabled.
      // The functions below will handle the case where the app is not initialized.
    }
  } else {
    console.warn("FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable is not set. Admin features will be disabled.");
  }
} else {
    app = admin.apps[0]!;
}


function getSafeAdminSDK<T>(serviceName: string, getService: (app: admin.app.App) => T, mock: T) {
    if (admin.apps.length > 0) {
        return getService(admin.app());
    }
    
    console.warn(`Firebase Admin SDK not initialized. Mocking ${serviceName}.`);
    return mock;
}


export const auth = getSafeAdminSDK<admin.auth.Auth>(
    'auth',
    (app) => app.auth(),
    {
      verifyIdToken: async () => { throw new Error("Admin SDK not initialized"); }
    } as any
);

export const db = getSafeAdminSDK<admin.firestore.Firestore>(
    'firestore',
    (app) => app.firestore(),
    {
      collection: () => ({
        doc: () => ({
            update: async () => {},
            get: async () => ({exists: false, data: () => ({})}),
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
    } as any
);
