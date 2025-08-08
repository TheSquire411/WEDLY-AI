import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Stripe API endpoints
  http.post('https://api.stripe.com/v1/checkout/sessions', () => {
    return HttpResponse.json({
      id: 'cs_test_mock_session_id',
      url: 'https://checkout.stripe.com/pay/cs_test_mock_session_id',
      payment_status: 'unpaid',
      amount_total: 4999,
      currency: 'aud',
      customer_email: 'test@example.com',
    })
  }),

  // Mock Firebase Auth token verification
  http.post('https://identitytoolkit.googleapis.com/v1/accounts:lookup', () => {
    return HttpResponse.json({
      users: [{
        localId: 'test-user-id',
        email: 'test@example.com',
        emailVerified: true,
      }]
    })
  }),

  // Mock SMTP server (for email testing)
  http.post('https://smtp.test.com/send', () => {
    return HttpResponse.json({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: [],
    })
  }),
]