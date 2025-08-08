import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Firebase Admin
vi.mock('~/src/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue({
          exists: false
        })
      })
    })
  }
}))

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: vi.fn()
      }
    }))
  }
}))

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

describe('Webhook Processing Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Stripe Webhook Signature Verification', () => {
    it('should process valid webhook with correct signature', async () => {
      const Stripe = await import('stripe')
      const mockStripe = new Stripe.default('sk_test_mock', { apiVersion: '2024-06-20' })
      
      // Mock successful signature verification
      vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValueOnce({
        id: 'evt_test_webhook',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_session',
            payment_intent: 'pi_test_intent',
            customer_email: 'test@example.com',
            amount_total: 4999,
            currency: 'aud',
            payment_status: 'paid'
          }
        }
      } as any)

      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const webhookPayload = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'checkout.session.completed'
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid-signature',
          'Content-Type': 'application/json'
        },
        body: webhookPayload
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        webhookPayload,
        'valid-signature',
        'whsec_test_mock'
      )
    })

    it('should reject webhook with invalid signature', async () => {
      const Stripe = await import('stripe')
      const mockStripe = new Stripe.default('sk_test_mock', { apiVersion: '2024-06-20' })
      
      // Mock signature verification failure
      vi.mocked(mockStripe.webhooks.constructEvent).mockImplementationOnce(() => {
        throw new Error('Invalid signature')
      })

      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'invalid-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'checkout.session.completed' })
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })
  })

  describe('Checkout Session Completed Event Processing', () => {
    it('should save purchase record to Firestore on successful payment', async () => {
      const Stripe = await import('stripe')
      const mockStripe = new Stripe.default('sk_test_mock', { apiVersion: '2024-06-20' })
      
      const mockEvent = {
        id: 'evt_test_webhook',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_session',
            payment_intent: 'pi_test_intent',
            customer_email: 'test@example.com',
            amount_total: 4999,
            currency: 'aud',
            payment_status: 'paid'
          }
        }
      }

      vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as any)

      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      const { adminDb } = await import('~/src/lib/firebase-admin')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockEvent)
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      // Verify purchase record was saved
      expect(adminDb.collection).toHaveBeenCalledWith('purchases')
      const mockDoc = adminDb.collection().doc()
      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeSessionId: 'cs_test_session',
          stripePaymentIntentId: 'pi_test_intent',
          userEmail: 'test@example.com',
          amount: 4999,
          currency: 'aud',
          status: 'completed'
        })
      )
    })

    it('should handle idempotency for duplicate webhook events', async () => {
      const Stripe = await import('stripe')
      const mockStripe = new Stripe.default('sk_test_mock', { apiVersion: '2024-06-20' })
      const { adminDb } = await import('~/src/lib/firebase-admin')
      
      // Mock existing purchase record
      const mockDoc = {
        set: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            stripeSessionId: 'cs_test_session',
            status: 'completed'
          })
        })
      }
      
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue(mockDoc)
      } as any)

      const mockEvent = {
        id: 'evt_test_webhook',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_session',
            payment_intent: 'pi_test_intent',
            customer_email: 'test@example.com',
            amount_total: 4999,
            currency: 'aud',
            payment_status: 'paid'
          }
        }
      }

      vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as any)

      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockEvent)
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      
      // Should not create duplicate record
      expect(mockDoc.set).not.toHaveBeenCalled()
    })

    it('should handle unsupported webhook event types', async () => {
      const Stripe = await import('stripe')
      const mockStripe = new Stripe.default('sk_test_mock', { apiVersion: '2024-06-20' })
      
      const mockEvent = {
        id: 'evt_test_webhook',
        type: 'payment_intent.created', // Unsupported event type
        data: {
          object: {
            id: 'pi_test_intent'
          }
        }
      }

      vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as any)

      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockEvent)
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
    })
  })

  describe('Database Error Handling', () => {
    it('should handle Firestore write failures with retry', async () => {
      const Stripe = await import('stripe')
      const mockStripe = new Stripe.default('sk_test_mock', { apiVersion: '2024-06-20' })
      const { adminDb } = await import('~/src/lib/firebase-admin')
      
      // Mock database failure then success on retry
      const mockDoc = {
        set: vi.fn()
          .mockRejectedValueOnce(new Error('Database error'))
          .mockResolvedValueOnce({}),
        get: vi.fn().mockResolvedValue({ exists: false })
      }
      
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue(mockDoc)
      } as any)

      const mockEvent = {
        id: 'evt_test_webhook',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_session',
            payment_intent: 'pi_test_intent',
            customer_email: 'test@example.com',
            amount_total: 4999,
            currency: 'aud',
            payment_status: 'paid'
          }
        }
      }

      vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent as any)

      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockEvent)
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(mockDoc.set).toHaveBeenCalledTimes(2) // Initial attempt + retry
    })
  })
})