import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication Errors', () => {
    it('should handle missing authorization header', async () => {
      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Authorization header missing')
    })

    it('should handle invalid Firebase ID token', async () => {
      // Mock Firebase Admin to reject token
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminAuth: {
          verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token'))
        }
      }))

      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Invalid token')
    })

    it('should handle expired Firebase ID token', async () => {
      // Mock Firebase Admin to reject expired token
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminAuth: {
          verifyIdToken: vi.fn().mockRejectedValue({
            code: 'auth/id-token-expired',
            message: 'Firebase ID token has expired'
          })
        }
      }))

      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer expired-token',
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('expired')
    })
  })

  describe('Stripe API Errors', () => {
    it('should handle Stripe rate limiting', async () => {
      // Mock Firebase Admin for successful auth
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminAuth: {
          verifyIdToken: vi.fn().mockResolvedValue({
            uid: 'test-user-id',
            email: 'test@example.com'
          })
        }
      }))

      // Mock Stripe to return rate limit error
      vi.doMock('stripe', () => {
        return {
          default: vi.fn().mockImplementation(() => ({
            checkout: {
              sessions: {
                create: vi.fn().mockRejectedValue({
                  type: 'StripeError',
                  code: 'rate_limit',
                  message: 'Too many requests'
                })
              }
            }
          }))
        }
      })

      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('rate limit')
    })

    it('should handle Stripe API key errors', async () => {
      // Mock Firebase Admin for successful auth
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminAuth: {
          verifyIdToken: vi.fn().mockResolvedValue({
            uid: 'test-user-id',
            email: 'test@example.com'
          })
        }
      }))

      // Mock Stripe to return authentication error
      vi.doMock('stripe', () => {
        return {
          default: vi.fn().mockImplementation(() => ({
            checkout: {
              sessions: {
                create: vi.fn().mockRejectedValue({
                  type: 'StripeAuthenticationError',
                  message: 'Invalid API Key provided'
                })
              }
            }
          }))
        }
      })

      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Payment service configuration error')
    })

    it('should handle Stripe network timeouts', async () => {
      // Mock Firebase Admin for successful auth
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminAuth: {
          verifyIdToken: vi.fn().mockResolvedValue({
            uid: 'test-user-id',
            email: 'test@example.com'
          })
        }
      }))

      // Mock Stripe to timeout
      vi.doMock('stripe', () => {
        return {
          default: vi.fn().mockImplementation(() => ({
            checkout: {
              sessions: {
                create: vi.fn().mockRejectedValue({
                  type: 'StripeConnectionError',
                  message: 'Request timeout'
                })
              }
            }
          }))
        }
      })

      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toContain('service temporarily unavailable')
    })
  })

  describe('Database Errors', () => {
    it('should handle Firestore connection failures', async () => {
      // Mock Stripe for successful webhook verification
      vi.doMock('stripe', () => {
        return {
          default: vi.fn().mockImplementation(() => ({
            webhooks: {
              constructEvent: vi.fn().mockReturnValue({
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
              })
            }
          }))
        }
      })

      // Mock Firebase Admin to fail database operations
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminDb: {
          collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ exists: false }),
              set: vi.fn().mockRejectedValue(new Error('Firestore unavailable'))
            })
          })
        }
      }))

      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'evt_test_webhook',
          type: 'checkout.session.completed'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Database error')
    })

    it('should handle Firestore permission errors', async () => {
      // Mock Stripe for successful webhook verification
      vi.doMock('stripe', () => {
        return {
          default: vi.fn().mockImplementation(() => ({
            webhooks: {
              constructEvent: vi.fn().mockReturnValue({
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
              })
            }
          }))
        }
      })

      // Mock Firebase Admin to fail with permission error
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminDb: {
          collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ exists: false }),
              set: vi.fn().mockRejectedValue({
                code: 'permission-denied',
                message: 'Insufficient permissions'
              })
            })
          })
        }
      }))

      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'evt_test_webhook',
          type: 'checkout.session.completed'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Database permission error')
    })
  })

  describe('Configuration Errors', () => {
    it('should handle missing environment variables', async () => {
      // Temporarily remove required environment variable
      const originalStripeKey = process.env.STRIPE_SECRET_KEY
      delete process.env.STRIPE_SECRET_KEY

      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Configuration error')

      // Restore environment variable
      process.env.STRIPE_SECRET_KEY = originalStripeKey
    })

    it('should handle malformed Firebase configuration', async () => {
      // Temporarily corrupt Firebase private key
      const originalPrivateKey = process.env.FIREBASE_PRIVATE_KEY
      process.env.FIREBASE_PRIVATE_KEY = 'invalid-private-key'

      // Mock Firebase Admin to fail initialization
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminAuth: {
          verifyIdToken: vi.fn().mockRejectedValue(new Error('Firebase initialization failed'))
        }
      }))

      const { POST } = await import('~/src/app/api/create-checkout-session/route')
      
      const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Authentication service error')

      // Restore environment variable
      process.env.FIREBASE_PRIVATE_KEY = originalPrivateKey
    })
  })

  describe('Request Validation Errors', () => {
    it('should handle malformed JSON in webhook requests', async () => {
      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid-signature',
          'Content-Type': 'application/json'
        },
        body: 'invalid-json{'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid request body')
    })

    it('should handle missing required headers', async () => {
      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'checkout.session.completed' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing stripe-signature header')
    })

    it('should handle unsupported HTTP methods', async () => {
      const { GET } = await import('~/src/app/api/create-checkout-session/route')
      
      if (GET) {
        const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
          method: 'GET'
        })

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(405)
        expect(data.error).toContain('Method not allowed')
      }
    })
  })

  describe('Error Recovery and Retry Logic', () => {
    it('should implement exponential backoff for transient errors', async () => {
      // Mock Firebase Admin to fail twice then succeed
      let callCount = 0
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminDb: {
          collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ exists: false }),
              set: vi.fn().mockImplementation(() => {
                callCount++
                if (callCount <= 2) {
                  return Promise.reject(new Error('Transient error'))
                }
                return Promise.resolve({})
              })
            })
          })
        }
      }))

      // Mock Stripe for successful webhook verification
      vi.doMock('stripe', () => {
        return {
          default: vi.fn().mockImplementation(() => ({
            webhooks: {
              constructEvent: vi.fn().mockReturnValue({
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
              })
            }
          }))
        }
      })

      const { POST } = await import('~/src/app/api/webhooks/stripe/route')
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'valid-signature',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'evt_test_webhook',
          type: 'checkout.session.completed'
        })
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(callCount).toBe(3) // Initial attempt + 2 retries
    })
  })
})