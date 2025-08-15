
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuth } from '@/lib/firebase-admin'; // Using admin SDK for server-side verification

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
        return new NextResponse('User not found', { status: 404 });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
        throw new Error('Stripe Price ID is not configured.');
    }
    
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?payment_success=true`,
      cancel_url: `${origin}/?payment_cancelled=true`,
      client_reference_id: userId, // Pass the user's ID to the session
    });

    if (!session.id) {
        throw new Error("Could not create Stripe session");
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error("Error creating Stripe session:", error);
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
  }
}
