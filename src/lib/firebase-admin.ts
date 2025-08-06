
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    // Check if the service account JSON is set
    const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
    if (!serviceAccount) {
        throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable is not set.');
    }
  
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
    } catch(error) {
        console.error("Firebase admin initialization error", error);
        throw error;
    }
}

export const auth = admin.auth();
export const db = admin.firestore();
