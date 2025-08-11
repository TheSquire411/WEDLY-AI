// src/lib/auth-middleware.ts
// Server-side authentication middleware for API routes

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth'; // Server-side Firebase Admin

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email?: string;
    [key: string]: any;
  } | null;
}

export async function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get authorization header
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }

      // Extract token
      const token = authHeader.substring(7);

      // Verify token using Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Add user info to request
      (request as AuthenticatedRequest).user = {
        ...decodedToken,
      };

      // Call the original handler
      return await handler(request as AuthenticatedRequest);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
  };
}

// Helper function to get authenticated user from request
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    return {
      ...decodedToken,
    };
  } catch (error) {
    console.error('Get authenticated user error:', error);
    return null;
  }
}

// Helper function for optional authentication
export async function withOptionalAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await getAuthenticatedUser(request);
      (request as AuthenticatedRequest).user = user;
      return await handler(request as AuthenticatedRequest);
    } catch (error) {
      console.error('Optional auth error:', error);
      return await handler(request as AuthenticatedRequest);
    }
  };
}