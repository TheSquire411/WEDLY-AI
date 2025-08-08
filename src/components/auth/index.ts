// Authentication Components
export { default as AuthProvider, useAuth } from './AuthProvider';
export { default as LoginForm } from './LoginForm';
export { default as SignupForm } from './SignupForm';
export { default as AuthModal } from './AuthModal';
export { default as ProtectedRoute, withAuth } from './ProtectedRoute';
export { default as UserProfile } from './UserProfile';

// Re-export auth utilities for convenience
export {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  resetPassword,
  createUserDocument,
  getUserDocument,
  onAuthStateChange,
  getCurrentUser,
  isAuthenticated,
  getIdToken,
  waitForAuth,
  isValidEmail,
  validatePassword
} from '../../../lib/auth';