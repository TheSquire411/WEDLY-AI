// src/components/auth/index.ts

// Named exports from AuthProvider.tsx
export { AuthProvider, useAuth } from './AuthProvider';

// These assume the components export default.
// If yours use named exports, see the note below.
export { default as LoginForm } from './LoginForm';
export { default as SignupForm } from './SignupForm';
export { default as AuthModal } from './AuthModal';
export { ProtectedRoute } from './ProtectedRoute';