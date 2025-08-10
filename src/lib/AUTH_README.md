# Authentication System Documentation

This document provides comprehensive guidance on using the Firebase authentication system implemented for Wedly.

## Overview

The authentication system provides:
- User registration and login with email/password
- Authentication state management with React Context
- Protected routes and components
- Server-side authentication for API routes
- User profile management
- Premium access control

## Quick Start

### 1. Wrap your app with AuthProvider

```tsx
// app/layout.tsx or _app.tsx
import { AuthProvider } from '../components/auth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Use authentication in components

```tsx
import { useAuth } from '../components/auth';

function MyComponent() {
  const { user, userData, isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {user.displayName}!</div>;
}
```

### 3. Protect routes

```tsx
import { ProtectedRoute } from '../components/auth';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected dashboard content</div>
    </ProtectedRoute>
  );
}

// Or use the HOC
import { withAuth } from '../components/auth';

const DashboardPage = withAuth(() => {
  return <div>Protected dashboard content</div>;
});
```

## Components

### AuthProvider

Provides authentication context to the entire app.

```tsx
import { AuthProvider, useAuth } from '../components/auth';

// Wrap your app
<AuthProvider>
  <App />
</AuthProvider>

// Use in components
const { user, userData, loading, isAuthenticated } = useAuth();
```

### LoginForm

Standalone login form component.

```tsx
import { LoginForm } from '../components/auth';

<LoginForm
  onSuccess={() => router.push('/dashboard')}
  onSwitchToSignup={() => setMode('signup')}
/>
```

### SignupForm

Standalone signup form component.

```tsx
import { SignupForm } from '../components/auth';

<SignupForm
  onSuccess={() => router.push('/dashboard')}
  onSwitchToLogin={() => setMode('login')}
/>
```

### AuthModal

Modal that can switch between login and signup.

```tsx
import { AuthModal } from '../components/auth';

<AuthModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  defaultMode="login"
  onSuccess={() => router.push('/dashboard')}
/>
```

### ProtectedRoute

Wrapper component for protecting routes.

```tsx
import { ProtectedRoute } from '../components/auth';

<ProtectedRoute 
  redirectTo="/auth"
  requirePremium={false}
  fallback={<Loading />}
>
  <ProtectedContent />
</ProtectedRoute>
```

### UserProfile

Displays user information and authentication status.

```tsx
import { UserProfile } from '../components/auth';

<UserProfile showAuthModal={true} />
```

## Hooks

### useAuth

Main authentication hook.

```tsx
import { useAuth } from '../components/auth';

const {
  user,           // Firebase user object
  userData,       // Additional user data from Firestore
  loading,        // Loading state
  isAuthenticated // Boolean authentication status
} = useAuth();
```

### useAuthGuard

Hook for protecting components and handling auth requirements.

```tsx
import { useAuthGuard } from '../hooks/useAuthGuard';

const {
  user,
  userData,
  loading,
  isAuthenticated,
  isPremium,
  canAccess
} = useAuthGuard({
  redirectTo: '/auth',
  requireAuth: true,
  requirePremium: false,
  onAuthRequired: () => setShowAuthModal(true),
  onPremiumRequired: () => setShowUpgradeModal(true)
});
```

### usePremiumGuard

Specialized hook for premium features.

```tsx
import { usePremiumGuard } from '../hooks/useAuthGuard';

const { canAccess, isPremium } = usePremiumGuard(() => {
  setShowUpgradeModal(true);
});
```

### useGuestGuard

Hook for pages that should redirect authenticated users.

```tsx
import { useGuestGuard } from '../hooks/useAuthGuard';

// Use in login/signup pages
const { canAccess } = useGuestGuard('/dashboard');
```

## Authentication Functions

### Client-side Functions

```tsx
import {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  resetPassword,
  getCurrentUser,
  getIdToken
} from '../lib/auth';

// Sign up
const { user, error } = await signUpWithEmail(email, password, displayName);

// Sign in
const { user, error } = await signInWithEmail(email, password);

// Sign out
const { success, error } = await signOutUser();

// Reset password
const { success, error } = await resetPassword(email);

// Get current user
const user = getCurrentUser();

// Get ID token for API calls
const token = await getIdToken();
```

### Server-side Functions (API Routes)

```tsx
import { verifyAuthToken, requireAuth, getUserId } from '../lib/auth';

// In API routes
export async function POST(request) {
  try {
    // Verify token
    const { user, error } = await verifyAuthToken(request);
    if (error) {
      return Response.json({ error }, { status: 401 });
    }

    // Or require auth (throws on failure)
    const user = await requireAuth(request);
    
    // Or just get user ID
    const userId = await getUserId(request);
    
    // Your protected API logic here
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }
}
```

## Making Authenticated API Calls

### From Client Components

```tsx
import { getIdToken } from '../lib/auth';

async function makeAuthenticatedRequest() {
  const token = await getIdToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/protected-endpoint', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: 'example' }),
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}
```

## Error Handling

The authentication system provides user-friendly error messages:

```tsx
const { user, error } = await signInWithEmail(email, password);

if (error) {
  // Error messages are already user-friendly:
  // "No account found with this email address."
  // "Incorrect password. Please try again."
  // "Please enter a valid email address."
  console.error(error);
}
```

## Validation

### Email Validation

```tsx
import { isValidEmail } from '../lib/auth';

if (!isValidEmail(email)) {
  setError('Please enter a valid email address');
}
```

### Password Validation

```tsx
import { validatePassword } from '../lib/auth';

const { isValid, errors } = validatePassword(password);

if (!isValid) {
  console.log('Password errors:', errors);
  // ["Password must be at least 6 characters long"]
}
```

## User Data Management

### Creating User Documents

User documents are automatically created in Firestore when users sign up:

```tsx
// Automatic creation on signup
const { user, error } = await signUpWithEmail(email, password, displayName);

// Manual creation
await createUserDocument(user, { 
  premium: false,
  customField: 'value' 
});
```

### Fetching User Data

```tsx
import { getUserDocument } from '../lib/auth';

const userData = await getUserDocument(userId);
console.log(userData); // { uid, email, displayName, premium, createdAt, ... }
```

## Premium Access Control

### Component Level

```tsx
<ProtectedRoute requirePremium={true}>
  <PremiumFeature />
</ProtectedRoute>
```

### Hook Level

```tsx
const { isPremium, canAccess } = usePremiumGuard();

if (!canAccess) {
  return <UpgradePrompt />;
}
```

### API Level

```tsx
// In API routes
const userId = await getUserId(request);
const hasPremium = await checkPremiumAccess(userId);

if (!hasPremium) {
  return Response.json({ error: 'Premium required' }, { status: 403 });
}
```

## Best Practices

### 1. Always Handle Loading States

```tsx
const { user, loading } = useAuth();

if (loading) {
  return <LoadingSpinner />;
}
```

### 2. Use Proper Error Handling

```tsx
try {
  const { user, error } = await signInWithEmail(email, password);
  if (error) {
    setErrorMessage(error);
    return;
  }
  // Success handling
} catch (error) {
  setErrorMessage('An unexpected error occurred');
}
```

### 3. Validate Input Before Submission

```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!isValidEmail(email)) {
    setError('Invalid email');
    return;
  }
  
  const { isValid, errors } = validatePassword(password);
  if (!isValid) {
    setError(errors[0]);
    return;
  }
  
  // Proceed with submission
};
```

### 4. Use TypeScript for Better Type Safety

```tsx
import { User } from 'firebase/auth';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  premium?: boolean;
}

const { user, userData }: { 
  user: User | null, 
  userData: UserData | null 
} = useAuth();
```

### 5. Implement Proper Cleanup

```tsx
useEffect(() => {
  const unsubscribe = onAuthStateChange((user) => {
    // Handle auth state changes
  });

  return unsubscribe; // Cleanup on unmount
}, []);
```

## Troubleshooting

### Common Issues

1. **"useAuth must be used within an AuthProvider"**
   - Ensure AuthProvider wraps your app at the root level

2. **Token verification fails in API routes**
   - Check that the Authorization header is properly set
   - Ensure Firebase Admin is properly initialized

3. **User data not loading**
   - Check Firestore security rules
   - Verify user document exists

4. **Infinite redirects**
   - Check loading states in protected routes
   - Ensure proper condition handling in useEffect

### Debug Mode

Enable debug logging by setting environment variable:
```bash
NEXT_PUBLIC_DEBUG_AUTH=true
```

This will log authentication state changes and errors to the console.