/**
 * Firebase Authentication Utilities
 * 
 * This module provides helper functions for Firebase authentication,
 * including user login/signup, authentication state management,
 * and protected route utilities.
 */

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/lib/firebase';

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} displayName - User's display name (optional)
 * @returns {Promise<{user: User, error: null} | {user: null, error: string}>}
 */
export async function signUpWithEmail(email, password, displayName = '') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user document in Firestore
    await createUserDocument(user, { displayName });

    return { user, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
}

/**
 * Sign in user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<{user: User, error: null} | {user: null, error: string}>}
 */
export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: 'Failed to sign out. Please try again.' };
  }
}

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

/**
 * Create or update user document in Firestore
 * @param {User} user - Firebase user object
 * @param {object} additionalData - Additional user data
 * @returns {Promise<void>}
 */
export async function createUserDocument(user, additionalData = {}) {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const { displayName, email, uid } = user;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        uid,
        displayName: displayName || '',
        email,
        premium: false,
        createdAt,
        updatedAt: createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }
}

/**
 * Get user document from Firestore
 * @param {string} userId - User's UID
 * @returns {Promise<object | null>} User document data or null
 */
export async function getUserDocument(userId) {
  if (!userId) return null;

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    return null;
  }
}

/**
 * Authentication state listener
 * @param {function} callback - Callback function to handle auth state changes
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current authenticated user
 * @returns {User | null} Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export function isAuthenticated() {
  return !!auth.currentUser;
}

/**
 * Get user's ID token for API authentication
 * @param {boolean} forceRefresh - Force token refresh
 * @returns {Promise<string | null>} ID token or null
 */
export async function getIdToken(forceRefresh = false) {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

/**
 * Wait for authentication to initialize
 * @returns {Promise<User | null>} Current user after auth initialization
 */
export function waitForAuth() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Convert Firebase auth error codes to user-friendly messages
 * @param {string} errorCode - Firebase auth error code
 * @returns {string} User-friendly error message
 */
function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{isValid: boolean, errors: string[]}} Validation result
 */
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
