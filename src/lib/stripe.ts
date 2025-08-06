
"use client";

import { loadStripe, Stripe } from '@stripe/stripe-js';

// This is a singleton to ensure we only load Stripe once.
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    // The other AI will need to fill in the publishable key.
    // It is safe to expose this key in the browser.
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
        throw new Error("Stripe publishable key is not set in .env");
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};


export async function redirectToCheckout(): Promise<string | null> {
    try {
        // 1. Create a checkout session on your backend.
        // The other AI will implement this API route.
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const { error } = await response.json();
            throw new Error(error || "Failed to create checkout session.");
        }

        const { sessionId } = await response.json();
        
        // 2. Redirect to Stripe checkout.
        const stripe = await getStripe();
        if (!stripe) {
            throw new Error('Stripe.js has not loaded yet.');
        }

        const { error } = await stripe.redirectToCheckout({ sessionId });
        
        if (error) {
            console.error(error);
            return error.message || "An unknown error occurred during redirect.";
        }

        return null; // Redirect will happen, this line shouldn't be reached.
    } catch (error: any) {
        console.error(error);
        return error.message || "An unexpected error occurred.";
    }
}
