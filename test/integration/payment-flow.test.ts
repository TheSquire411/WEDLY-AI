import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Firebase Admin
vi.mock('~/src/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user-id',
      email: 'test@example.com'
    })
  },
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            userId: 'test-user-id',
            userEmail: 'test@example.com',
            amount: 4999,
            currency: 'aud',
            status: 'completed'
          })
        })
      }),
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [{
              id: 'purchase-1',
              data: () => ({
                userId: 'test-user-id',
                userEmail: 'test@example.com',
                amount: 4999,
                currency: 'aud',
                status: 'completed',
                createdAt: { toDate: () => new Date() }
              })
            }]
          })
        })
      })
    })
  }
}))

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'cs_test_mock_session_id',
            url: 'https://checkout.stripe.com/pay/cs_test_mock_session_id'
          })
        }
      },
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          id: 'evt_test_webhook',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_mock_session_id',
              payment_intent: 'pi_test_payment_intent',
              customer_email: 'test@example.com',
              amount_total: 4999,
              currency: 'aud',
              payment_status: 'paid'
            }
          }
        })
      }
    }))
  }
})

// Mock Nodemailer
vi.mock('nodemailer', () => ({
  createTransport: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: []
    })
  })
}))

describe('Payment Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Checkout Session', () => {
    it('should create a checkout session for authenticated user', async () => {
      // Import the API route handler
      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-id-token',
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sessionId')
      expect(data.sessionId).toBe('cs_test_mock_session_id')
    })

    it('should reject unauthenticated requests', async () => {
      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })

    it('should handle Stripe API errors gracefully', async () => {
      // Mock Stripe to throw an error
      const Stripe = await import('stripe')
      const mockStripe = new Stripe.default('sk_test_mock', { apiVersion: '2024-06-20' })
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValueOnce(
        new Error('Stripe API Error')
      )

      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-id-token',
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      
      expect(response.status).toBe(500)
    })
  })

  describe('End-to-End Payment Flow', () => {
    it('should complete full payment flow from session creation to webhook processing', async () => {
      // Step 1: Create checkout session
      const { POST: createSession } = await import('~/src/app/api/create-checkout-session/route')
      
      const sessionRequest = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-id-token',
          'Content-Type': 'application/json'
        }
      })

      const sessionResponse = await createSession(sessionRequest)
      const sessionData = await sessionResponse.json()

      expect(sessionResponse.status).toBe(200)
      expect(sessionData.sessionId).toBe('cs_test_mock_session_id')

      // Step 2: Process webhook (simulating Stripe webhook after payment)
      const { POST: processWebhook } = await import('~/src/app/api/webhooks/stripe/route')
      
      const webhookPayload = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_mock_session_id',
            payment_intent: 'pi_test_payment_intent',
            customer_email: 'test@example.com',
            amount_total: 4999,
            currency: 'aud',
            payment_status: 'paid'
          }
        }
      })

      const webhookRequest = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test-signature',
          'Content-Type': 'application/json'
        },
        body: webhookPayload
      })

      const webhookResponse = await processWebhook(webhookRequest)
      
      expect(webhookResponse.status).toBe(200)

      // Verify that the purchase was saved to database
      const { adminDb } = await import('~/src/lib/firebase-admin')
      expect(adminDb.collection).toHaveBeenCalledWith('purchases')
    })
  })
})