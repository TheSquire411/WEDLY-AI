import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
        return new NextResponse('User not found', { status: 404 });
    }

    await auth.setCustomUserClaims(userId, { isAdmin: true });

    return new NextResponse(JSON.stringify({ message: 'Admin claim set successfully.' }), { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error("Error setting admin claim:", error);
    return new NextResponse(message, { status: 500 });
  }
}
