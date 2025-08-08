# Implementation Plan

- [x] 1. Create centralized configuration system





  - Create `lib/config.js` file with public and server configuration objects
  - Implement environment variable loading with proper client/server separation
  - Add Firebase private key newline character handling
  - Include all required environment variables for Stripe, Firebase, email, and Unsplash
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Create environment variables template





  - Create `.env.local.template` file with all required environment variables
  - Include clear comments explaining each variable's purpose
  - Separate public and private variables with clear sections
  - Add deployment instructions for Vercel configuration
  - _Requirements: 2.6, 2.7_

- [x] 3. Update Firebase client configuration









  - Modify `src/lib/firebase.ts` to use centralized config instead of hardcoded values
  - Import configuration from `lib/config.js`
  - Ensure only public Firebase configuration is used
  - Add proper error handling for missing configuration
  - _Requirements: 6.1, 6.2, 2.2_

- [x] 4. Update Firebase Admin configuration





  - Modify `src/lib/firebase-admin.ts` to use centralized config
  - Replace JSON parsing with individual environment variables
  - Use server configuration object for admin credentials
  - Add comprehensive error handling and validation
  - _Requirements: 2.3, 2.5_

- [x] 5. Update Stripe client configuration





  - Modify `src/lib/stripe.ts` to use centralized config
  - Import public Stripe configuration from config file
  - Maintain existing client-side functionality
  - Add proper error handling for missing publishable key
  - _Requirements: 2.2, 1.1_

- [x] 6. Create server-side Stripe utilities





  - Create `lib/stripeServer.js` for server-side Stripe operations
  - Initialize Stripe with secret key from server configuration
  - Add utility functions for session creation and webhook verification
  - Include comprehensive error handling
  - _Requirements: 1.1, 5.1, 5.2_

- [x] 7. Update checkout session API route





  - Modify `src/app/api/create-checkout-session/route.ts` to use centralized config
  - Update to create session for exactly $49.99 AUD instead of using price ID
  - Improve error handling and response formatting
  - Add proper success and cancel URL configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Enhance webhook processing API route





  - Modify `src/app/api/webhooks/stripe/route.ts` to use centralized config
  - Add comprehensive purchase record creation in Firestore
  - Implement idempotency handling to prevent duplicate processing
  - Add detailed error logging and proper HTTP status codes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.1, 4.2_

- [ ] 9. Implement email notification system





  - Create `lib/email.js` with Nodemailer configuration using SMTP credentials
  - Create email template for purchase confirmation
  - Add email sending function with error handling
  - Integrate email sending into webhook processing
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 10. Create purchase history data access
  - Create `lib/purchases.js` with functions to query user purchase history
  - Implement secure data access using Firebase Admin SDK
  - Add functions to create and retrieve purchase records
  - Include proper error handling and data validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. Create success page component





  - Create `src/app/success/page.tsx` for post-payment success page
  - Implement user authentication check and redirect logic
  - Add purchase history display functionality
  - Include thank you message and transaction confirmation
  - _Requirements: 4.3, 6.3, 6.4_

- [x] 12. Add comprehensive error handling





  - Update all API routes with consistent error handling patterns
  - Add proper HTTP status codes and user-friendly error messages
  - Implement retry logic for database operations
  - Add detailed logging for debugging and monitoring
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 13. Create authentication utilities





  - Create `lib/auth.js` with Firebase authentication helper functions
  - Add user login/signup example components
  - Implement authentication state management
  - Add protected route utilities
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [-] 14. Add data validation and security








  - Implement input validation for all API endpoints
  - Add rate limiting for payment endpoints
  - Ensure proper CORS configuration
  - Add security headers and validation
  - _Requirements: 5.1, 5.2, 7.4, 7.5_

- [x] 15. Create integration tests




  - Write tests for payment flow end-to-end
  - Test webhook processing with mock Stripe events
  - Verify email sending functionality
  - Test error handling scenarios
  - _Requirements: All requirements verification_