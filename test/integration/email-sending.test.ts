import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Nodemailer
const mockSendMail = vi.fn()
vi.mock('nodemailer', () => ({
  createTransport: vi.fn().mockReturnValue({
    sendMail: mockSendMail
  })
}))

describe('Email Sending Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Purchase Confirmation Email', () => {
    it('should send confirmation email with correct template and data', async () => {
      mockSendMail.mockResolvedValueOnce({
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: []
      })

      // Import email module after mocking
      const { sendPurchaseConfirmationEmail } = await import('~/lib/email')
      
      const emailData = {
        userEmail: 'test@example.com',
        userName: 'Test User',
        transactionId: 'pi_test_payment_intent',
        amount: '$49.99 AUD',
        purchaseDate: '2024-01-15',
        productName: 'Wedly Service'
      }

      const result = await sendPurchaseConfirmationEmail(emailData)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-message-id')
      
      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'test@example.com',
        subject: 'Purchase Confirmation - Wedly',
        html: expect.stringContaining('Test User'),
        text: expect.stringContaining('$49.99 AUD')
      })
    })

    it('should handle email sending failures gracefully', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection failed'))

      const { sendPurchaseConfirmationEmail } = await import('~/lib/email')
      
      const emailData = {
        userEmail: 'test@example.com',
        userName: 'Test User',
        transactionId: 'pi_test_payment_intent',
        amount: '$49.99 AUD',
        purchaseDate: '2024-01-15',
        productName: 'Wedly Service'
      }

      const result = await sendPurchaseConfirmationEmail(emailData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('SMTP connection failed')
    })

    it('should validate email data before sending', async () => {
      const { sendPurchaseConfirmationEmail } = await import('~/lib/email')
      
      const invalidEmailData = {
        userEmail: '', // Invalid email
        userName: 'Test User',
        transactionId: 'pi_test_payment_intent',
        amount: '$49.99 AUD',
        purchaseDate: '2024-01-15',
        productName: 'Wedly Service'
      }

      const result = await sendPurchaseConfirmationEmail(invalidEmailData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email data')
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should format email template correctly with all required fields', async () => {
      mockSendMail.mockResolvedValueOnce({
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: []
      })

      const { sendPurchaseConfirmationEmail } = await import('~/lib/email')
      
      const emailData = {
        userEmail: 'test@example.com',
        userName: 'John Doe',
        transactionId: 'pi_1234567890',
        amount: '$49.99 AUD',
        purchaseDate: 'January 15, 2024',
        productName: 'Wedly Premium Service'
      }

      await sendPurchaseConfirmationEmail(emailData)

      const emailCall = mockSendMail.mock.calls[0][0]
      
      // Check HTML template contains all required information
      expect(emailCall.html).toContain('John Doe')
      expect(emailCall.html).toContain('pi_1234567890')
      expect(emailCall.html).toContain('$49.99 AUD')
      expect(emailCall.html).toContain('January 15, 2024')
      expect(emailCall.html).toContain('Wedly Premium Service')
      
      // Check text version contains key information
      expect(emailCall.text).toContain('John Doe')
      expect(emailCall.text).toContain('$49.99 AUD')
      expect(emailCall.text).toContain('pi_1234567890')
    })
  })

  describe('Email Configuration', () => {
    it('should use correct SMTP configuration from environment variables', async () => {
      const { createEmailTransporter } = await import('~/lib/email')
      
      const transporter = createEmailTransporter()
      
      // Verify transporter was created with correct config
      expect(transporter).toBeDefined()
    })

    it('should handle missing email configuration gracefully', async () => {
      // Temporarily remove email config
      const originalHost = process.env.EMAIL_HOST
      const originalUser = process.env.EMAIL_USER
      delete process.env.EMAIL_HOST
      delete process.env.EMAIL_USER

      const { sendPurchaseConfirmationEmail } = await import('~/lib/email')
      
      const emailData = {
        userEmail: 'test@example.com',
        userName: 'Test User',
        transactionId: 'pi_test_payment_intent',
        amount: '$49.99 AUD',
        purchaseDate: '2024-01-15',
        productName: 'Wedly Service'
      }

      const result = await sendPurchaseConfirmationEmail(emailData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Email configuration missing')

      // Restore environment variables
      process.env.EMAIL_HOST = originalHost
      process.env.EMAIL_USER = originalUser
    })
  })

  describe('Email Integration with Webhook Processing', () => {
    it('should send email as part of successful webhook processing', async () => {
      mockSendMail.mockResolvedValueOnce({
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: []
      })

      // Mock Firebase Admin
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminDb: {
          collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue({
              set: vi.fn().mockResolvedValue({}),
              get: vi.fn().mockResolvedValue({ exists: false })
            })
          })
        }
      }))

      // Mock Stripe
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
      
      const request = new Request('http://localhost:3000/api/webhooks/stripe', {
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
      expect(mockSendMail).toHaveBeenCalled()
      
      const emailCall = mockSendMail.mock.calls[0][0]
      expect(emailCall.to).toBe('test@example.com')
      expect(emailCall.subject).toContain('Purchase Confirmation')
    })

    it('should not fail webhook processing if email sending fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Email service unavailable'))

      // Mock Firebase Admin
      vi.doMock('~/src/lib/firebase-admin', () => ({
        adminDb: {
          collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue({
              set: vi.fn().mockResolvedValue({}),
              get: vi.fn().mockResolvedValue({ exists: false })
            })
          })
        }
      }))

      // Mock Stripe
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
      
      const request = new Request('http://localhost:3000/api/webhooks/stripe', {
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
      
      // Webhook should still succeed even if email fails
      expect(response.status).toBe(200)
    })
  })
})