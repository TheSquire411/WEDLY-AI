/**
 * Server-side authentication utilities for API routes
 */

import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getServerConfig } from './config.js';

// Initialize Firebase Admin if not already initialized
function getFirebaseAdmin() {
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
  
  return getAuth();
}

/**
 * Verify Firebase ID token from request headers
 * @param {Request} request - The incoming request
 * @returns {Promise<{user: object, error: null} | {user: null, error: string}>}
 */
export async function verifyAuthToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization token provided' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const auth = getFirebaseAdmin();
    
    const decodedToken = await auth.verifyIdToken(token);
    return { user: decodedToken, error: null };
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return { user: null, error: 'Token expired' };
    } else if (error.code === 'auth/id-token-revoked') {
      return { user: null, error: 'Token revoked' };
    } else if (error.code === 'auth/invalid-id-token') {
      return { user: null, error: 'Invalid token' };
    }
    
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Middleware function to protect API routes
 * @param {Request} request - The incoming request
 * @returns {Promise<{user: object, error: null} | {user: null, error: string}>}
 */
export async function requireAuth(request) {
  const result = await verifyAuthToken(request);
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  return result.user;
}

/**
 * Extract user ID from authenticated request
 * @param {Request} request - The incoming request
 * @returns {Promise<string>} User ID
 * @throws {Error} If authentication fails
 */
export async function getUserId(request) {
  const user = await requireAuth(request);
  return user.uid;
}

/**
 * Check if user has premium access
 * @param {string} userId - User's UID
 * @returns {Promise<boolean>} True if user has premium access
 */
export async function checkPremiumAccess(userId) {
  try {
    // This would typically check the user's premium status in Firestore
    // For now, we'll return false as a placeholder
    // In a real implementation, you'd query the user document
    return false;
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
}