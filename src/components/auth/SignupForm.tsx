'use client';

import React, { useState } from 'react';
import { signUpWithEmail, isValidEmail, validatePassword } from '@/lib/client-auth-utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps): JSX.Element {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (authError) setAuthError('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const displayName = formData.displayName.trim();
    const email = formData.email.trim();

    if (!displayName) newErrors.displayName = 'Display name is required';
    else if (displayName.length < 2) newErrors.displayName = 'Display name must be at least 2 characters';

    if (!email) newErrors.email = 'Email is required';
    else if (!isValidEmail(email)) newErrors.email = 'Please enter a valid email address';

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const res = validatePassword(formData.password);
      if (!res.isValid) newErrors.password = res.errors[0] ?? 'Password does not meet requirements';
    }

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validateForm()) return;

    setIsLoading(true);
    setAuthError('');

    try {
      const email = formData.email.trim();
      const displayName = formData.displayName.trim();

      const { user, error } = await signUpWithEmail(email, formData.password, displayName);

      if (error) {
        setAuthError(error);
      } else if (user) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Sign up for a new account to get started</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {authError && (
            <Alert variant="destructive">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Enter your display name"
              disabled={isLoading}
              aria-invalid={!!errors.displayName}
              autoComplete="name"
              className={errors.displayName ? 'border-red-500' : ''}
            />
            {errors.displayName && <p className="text-sm text-red-500">{errors.displayName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              autoComplete="email"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password"
              disabled={isLoading}
              aria-invalid={!!errors.password}
              autoComplete="new-password"
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            <p className="text-xs text-gray-500">
              Password must be at least 6 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              autoComplete="new-password"
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>

          <div className="text-center mt-2">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Already have an account? Log in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
