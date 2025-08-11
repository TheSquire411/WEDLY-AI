// lib/auth.js
// Server-only Firebase Admin configuration
// This file should NEVER be imported on the client side

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Ensure this only runs on the server
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin SDK should only be used on the server side');
}

let adminApp;

// Helper function to format private key properly
function formatPrivateKey(key) {
  if (!key) {
    throw new Error('Firebase private key is missing');
  }
  return key.replace(/\\n/g, '\n');
}

// Validate required server-side environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required server environment variable: ${envVar}`);
  }
}

// Initialize Firebase Admin only if not already initialized
if (!getApps().length) {
  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
} else {
  adminApp = getApps()[0];
}

// Initialize Firebase Admin services
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export { adminApp as admin };

// Helper functions for common operations
export async function verifyIdToken(idToken) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return { success: true, user: decodedToken };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserByEmail(email) {
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    return { success: true, user: userRecord };
  } catch (error) {
    console.error('Get user by email error:', error);
    return { success: false, error: error.message };
  }
}

export async function createCustomToken(uid, additionalClaims = {}) {
  try {
    const customToken = await adminAuth.createCustomToken(uid, additionalClaims);
    return { success: true, token: customToken };
  } catch (error) {
    console.error('Create custom token error:', error);
    return { success: false, error: error.message };
  }
}

export default adminApp;