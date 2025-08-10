/**
 * Server-side Stripe Utilities
 * 
 * This module provides server-side Stripe operations including session creation
 * and webhook verification. It uses the centralized configuration system to
 * securely access Stripe credentials.
 * 
 * Requirements covered:
 * - 1.1: Secure payment processing with Stripe
 * - 5.1: Webhook signature verification
 * - 5.2: Proper error handling for webhook processing
 */

import Stripe from 'stripe';
import { getServerConfig } from './config.js';

let stripeInstance = null;

/**
 * Initialize Stripe instance with server configuration
 * @returns {Stripe} Configured Stripe instance
 * @throws {Error} If Stripe secret key is not configured
 */
function getStripeInstance() {
  if (!stripeInstance) {
    try {
      const serverConfig = getServerConfig();
      
      if (!serverConfig.stripe.secretKey) {
        throw new Error('Stripe secret key is not configured');
      }

      stripeInstance = new Stripe(serverConfig.stripe.secretKey, {
        apiVersion: '2023-10-16', // Use latest stable API version
        typescript: false,
      });

      console.log('Stripe server instance initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Stripe server instance:', error.message);
      throw new Error(`Stripe initialization failed: ${error.message}`);
    }
  }

  return stripeInstance;
}

/**
 * Create a Stripe Checkout session for $49.99 AUD payment
 * @param {Object} options - Session creation options
 * @param {string} options.userEmail - User's email address
 * @param {string} options.successUrl - URL to redirect after successful payment
 * @param {string} options.cancelUrl - URL to redirect after cancelled payment
 * @param {Object} [options.metadata] - Additional metadata to attach to the session
 * @returns {Promise<Stripe.Checkout.Session>} Created checkout session
 * @throws {Error} If session creation fails
 */
async function createCheckoutSession(options) {
  const { userEmail, successUrl, cancelUrl, metadata = {} } = options;

  // Validate required parameters
  if (!userEmail) {
    throw new Error('User email is required for checkout session creation');
  }
  if (!successUrl) {
    throw new Error('Success URL is required for checkout session creation');
  }
  if (!cancelUrl) {
    throw new Error('Cancel URL is required for checkout session creation');
  }

  try {
    const stripe = getStripeInstance();

    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Wedly Service',
              description: 'One-time payment for Wedly service access',
            },
            unit_amount: 4999, // $49.99 AUD in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userEmail,
        productName: 'Wedly Service',
        ...metadata,
      },
      // Enable automatic tax calculation if configured
      automatic_tax: { enabled: false },
      // Set session expiration to 24 hours
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    };

    console.log('💳 Creating Stripe checkout session for user:', {
      userEmail,
      amount: 4999,
      currency: 'aud',
      requestId: options.metadata?.requestId
    });
    
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    console.log('✅ Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url,
      userEmail,
      requestId: options.metadata?.requestId
    });
    
    return session;

  } catch (error) {
    console.error('❌ Failed to create checkout session:', {
      error: error.message,
      userEmail,
      type: error.type,
      code: error.code,
      stack: error.stack,
      requestId: options.metadata?.requestId
    });

    // Re-throw with more context for API routes
    if (error.type === 'StripeCardError') {
      throw new Error(`Payment error: ${error.message}`);
    } else if (error.type === 'StripeRateLimitError') {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid request: ${error.message}`);
    } else if (error.type === 'StripeAPIError') {
      throw new Error('Payment service temporarily unavailable. Please try again.');
    } else if (error.type === 'StripeConnectionError') {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.type === 'StripeAuthenticationError') {
      throw new Error('Payment service configuration error.');
    } else {
      throw new Error(`Checkout session creation failed: ${error.message}`);
    }
  }
}

/**
 * Verify Stripe webhook signature and parse event
 * @param {string|Buffer} payload - Raw webhook payload
 * @param {string} signature - Stripe signature header
 * @returns {Promise<Stripe.Event>} Verified Stripe event
 * @throws {Error} If signature verification fails
 */
async function verifyWebhookSignature(payload, signature) {
  if (!payload) {
    throw new Error('Webhook payload is required');
  }
  if (!signature) {
    throw new Error('Webhook signature is required');
  }

  try {
    const serverConfig = getServerConfig();
    
    if (!serverConfig.stripe.webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    const stripe = getStripeInstance();
    
    console.log('🔐 Verifying webhook signature...');
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      serverConfig.stripe.webhookSecret
    );

    console.log('✅ Webhook signature verified successfully:', {
      eventId: event.id,
      eventType: event.type,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode
    });

    return event;

  } catch (error) {
    console.error('❌ Webhook signature verification failed:', {
      error: error.message,
      hasPayload: !!payload,
      hasSignature: !!signature,
      payloadLength: payload ? payload.length : 0,
      stack: error.stack
    });

    // Provide specific error messages for different failure types
    if (error.message.includes('No signatures found matching the expected signature')) {
      throw new Error('Invalid webhook signature');
    } else if (error.message.includes('Timestamp outside the tolerance zone')) {
      throw new Error('Webhook timestamp too old');
    } else if (error.message.includes('Unable to extract timestamp and signatures')) {
      throw new Error('Malformed webhook signature');
    } else {
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }
}

/**
 * Retrieve a checkout session by ID
 * @param {string} sessionId - Stripe checkout session ID
 * @returns {Promise<Stripe.Checkout.Session>} Checkout session with line items
 * @throws {Error} If session retrieval fails
 */
async function retrieveCheckoutSession(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const stripe = getStripeInstance();
    
    console.log('📋 Retrieving checkout session:', sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    });

    console.log('✅ Checkout session retrieved successfully:', {
      sessionId: session.id,
      status: session.payment_status,
      customerEmail: session.customer_email,
      amount: session.amount_total,
      currency: session.currency
    });

    return session;

  } catch (error) {
    console.error('❌ Failed to retrieve checkout session:', {
      sessionId,
      error: error.message,
      type: error.type,
      stack: error.stack
    });

    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid session ID: ${sessionId}`);
    } else {
      throw new Error(`Failed to retrieve session: ${error.message}`);
    }
  }
}

/**
 * Retrieve payment intent details
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Stripe.PaymentIntent>} Payment intent details
 * @throws {Error} If payment intent retrieval fails
 */
async function retrievePaymentIntent(paymentIntentId) {
  if (!paymentIntentId) {
    throw new Error('Payment intent ID is required');
  }

  try {
    const stripe = getStripeInstance();
    
    console.log('💰 Retrieving payment intent:', paymentIntentId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('✅ Payment intent retrieved successfully:', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method
    });

    return paymentIntent;

  } catch (error) {
    console.error('❌ Failed to retrieve payment intent:', {
      paymentIntentId,
      error: error.message,
      type: error.type,
      stack: error.stack
    });

    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid payment intent ID: ${paymentIntentId}`);
    } else {
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }
}

/**
 * Validate webhook event type and extract relevant data
 * @param {Stripe.Event} event - Verified Stripe event
 * @returns {Object|null} Extracted event data or null if event type not supported
 */
function extractWebhookEventData(event) {
  if (!event || !event.type) {
    throw new Error('Invalid event object');
  }

  console.log('🔄 Processing webhook event:', {
    eventId: event.id,
    eventType: event.type,
    livemode: event.livemode,
    created: new Date(event.created * 1000).toISOString()
  });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      if (session.payment_status !== 'paid') {
        console.log('⏭️ Checkout session not paid, skipping:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
        });
        return null;
      }

      return {
        eventType: 'checkout.session.completed',
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total,
        currency: session.currency,
        paymentStatus: session.payment_status,
        metadata: session.metadata || {},
        created: session.created,
      };
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      
      return {
        eventType: 'payment_intent.succeeded',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata || {},
        created: paymentIntent.created,
      };
    }

    default:
      console.log('ℹ️ Unsupported webhook event type:', event.type);
      return null;
  }
}

export {
  getStripeInstance,
  createCheckoutSession,
  verifyWebhookSignature,
  retrieveCheckoutSession,
  retrievePaymentIntent,
  extractWebhookEventData,
};