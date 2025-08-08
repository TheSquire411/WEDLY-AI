/**
 * Firebase Admin Server Utilities
 * Server-side only Firebase Admin SDK utilities
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getServerConfig } from './config.js';

// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const serverConfig = getServerConfig();
    
    initializeApp({
      credential: cert({
        projectId: serverConfig.firebaseAdmin.projectId,
        clientEmail: serverConfig.firebaseAdmin.clientEmail,
        privateKey: serverConfig.firebaseAdmin.privateKey,
      }),
    });
  }
}

// Initialize on module load
initializeFirebaseAdmin();

/**
 * Get Firebase Auth instance
 * @returns {import('firebase-admin/auth').Auth} Firebase Auth instance
 */
export function auth() {
  return getAuth();
}

/**
 * Get Firestore instance
 * @returns {import('firebase-admin/firestore').Firestore} Firestore instance
 */
export function db() {
  return getFirestore();
}

/**
 * Check if Firebase Admin is initialized
 * @returns {boolean} True if initialized
 */
export function isInitialized() {
  return getApps().length > 0;
}