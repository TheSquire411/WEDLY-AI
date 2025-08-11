
"use client";

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { public as publicConfig } from '@/lib/config';

// This is a singleton to ensure we only load Stripe once.
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = publicConfig.stripe.publishableKey;
    
    if (!publishableKey) {
      throw new Error("Stripe publishable key is not configured. Please check your environment variables.");
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};


export async function redirectToCheckout(getIdToken: () => Promise<string | null>): Promise<string | null> {
    try {
        const idToken = await getIdToken();
        if (!idToken) {
            throw new Error("User not authenticated.");
        }

        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
             },
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(body || "Failed to create checkout session.");
        }

        const { sessionId } = await response.json();
        
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
