import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock environment variables for tests
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock'
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'mock-api-key'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'mock-project.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project'
process.env.FIREBASE_PROJECT_ID = 'mock-project'
process.env.FIREBASE_CLIENT_EMAIL = 'test@mock-project.iam.gserviceaccount.com'
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----'
process.env.EMAIL_HOST = 'smtp.test.com'
process.env.EMAIL_PORT = '587'
process.env.EMAIL_USER = 'test@example.com'
process.env.EMAIL_PASS = 'test-password'
process.env.EMAIL_FROM = 'test@example.com'