// app/api/webhooks/stripe/route.ts
export const runtime = 'nodejs'; // ensure Node runtime, not Edge

import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  const adminApp = getAdminApp();
  if (!adminApp) {
    console.error('Firebase Admin not configured');
    return new NextResponse('Server misconfigured', { status: 500 });
  }

  // ... webhook logic
  return new NextResponse('ok', { status: 200 });
}
