
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDb } from '@/lib/firebase-admin'; // Using admin SDK for server-side database operations

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`❌ Error message: ${err.message}`);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.client_reference_id;

      if (!userId) {
        throw new Error('No user ID found in session.');
      }
      
      // Update the user's record in Firestore to mark them as 'premium'
      const db = getDb();
      const userDocRef = db.collection('users').doc(userId);
      await userDocRef.update({ premium: true });

      console.log(`Successfully granted premium access to user: ${userId}`);
    }

    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
    
  } catch (error: any) {
    console.error("Error handling Stripe webhook:", error);
    return new NextResponse(error.message || 'Webhook Error', { status: 400 });
  }
}
