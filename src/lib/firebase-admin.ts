// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let _app: admin.app.App | null = null;

function parseServiceAccountFromJsonEnv() {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const json = JSON.parse(raw);
    return {
      projectId: json.project_id,
      clientEmail: json.client_email,
      privateKey: json.private_key?.replace(/\\n/g, '\n'),
    };
  } catch {
    console.warn('Invalid FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON');
    return null;
  }
}

export function getAdminApp() {
  if (_app) return _app;

  const fromJson = parseServiceAccountFromJsonEnv();
  const projectId = fromJson?.projectId ?? process.env.FIREBASE_PROJECT_ID;
  const clientEmail = fromJson?.clientEmail ?? process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey =
    fromJson?.privateKey ?? process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Only initialize if we actually have creds; otherwise defer errors to runtime where needed
  if (!admin.apps.length) {
    if (!projectId || !clientEmail || !privateKey) {
      // don't throw here; let callers decide what to do
      console.warn('Firebase Admin not initialized: missing credentials');
      return null;
    }
    _app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  return admin.app();
}
