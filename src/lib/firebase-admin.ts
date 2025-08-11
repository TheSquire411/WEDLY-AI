import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function getAdminApp() {
  if (app) return app;

  const fromJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON
    ? (() => {
        try {
          const j = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON!);
          return {
            projectId: j.project_id,
            clientEmail: j.client_email,
            privateKey: j.private_key?.replace(/\\n/g, '\n'),
          };
        } catch {
          return null;
        }
      })()
    : null;

  const projectId = fromJson?.projectId ?? process.env.FIREBASE_PROJECT_ID;
  const clientEmail = fromJson?.clientEmail ?? process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey =
    fromJson?.privateKey ?? process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // IMPORTANT: don’t throw at import/build time
    return null;
  }

  app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });

  return app;
}
