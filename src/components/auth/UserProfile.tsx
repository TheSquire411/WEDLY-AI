'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { signOutUser } from '../../../lib/auth';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { LogOut, User, Crown } from 'lucide-react';
import AuthModal from './AuthModal';

interface UserProfileProps {
  showAuthModal?: boolean;
}

export default function UserProfile({ showAuthModal = true }: UserProfileProps) {
  const { user, userData, isAuthenticated, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { success, error } = await signOutUser();
      if (!success && error) {
        console.error('Sign out error:', error);
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Welcome to Wedly</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Sign in to access your wedding planning tools and save your progress.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setIsAuthModalOpen(true)} 
                className="w-full"
                variant="default"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setIsAuthModalOpen(true)} 
                className="w-full"
                variant="outline"
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {showAuthModal && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            defaultMode="login"
          />
        )}
      </>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>
              {getInitials(user?.displayName || userData?.displayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium truncate">
                {user?.displayName || userData?.displayName || 'User'}
              </p>
              {userData?.premium && (
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}