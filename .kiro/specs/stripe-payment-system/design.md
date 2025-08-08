# Design Document

## Overview

The Stripe Payment System is designed as a secure, scalable payment processing solution for Wedly that integrates Stripe Checkout with Firebase authentication and Firestore database. The system follows a clear separation of concerns with centralized configuration management, secure environment variable handling, and comprehensive error handling throughout the payment flow.

The architecture builds upon the existing Firebase and Stripe infrastructure while adding email notifications, purchase history tracking, and improved configuration management. The system ensures that sensitive data never reaches the client-side while providing a seamless user experience for one-off $49.99 AUD payments.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    Client[Next.js Client] --> Config[lib/config.js]
    Client --> FirebaseClient[lib/firebaseClient.js]
    Client --> StripeClient[lib/stripe.js Client]
    
    Client --> CheckoutAPI[API: create-checkout-session]
    StripeCheckout[Stripe Checkout] --> WebhookAPI[API: stripe-webhook]
    
    CheckoutAPI --> StripeServer[Stripe Server SDK]
    CheckoutAPI --> FirebaseAdmin[lib/firebaseAdmin.js]
    
    WebhookAPI --> StripeServer
    WebhookAPI --> FirebaseAdmin
    WebhookAPI --> Nodemailer[Email Service]
    
    FirebaseAdmin --> Firestore[(Firestore Database)]
    
    SuccessPage[Success Page] --> FirebaseClient
    SuccessPage --> Firestore
    
    Config --> EnvVars[Environment Variables]
```

### Data Flow

1. **Payment Initiation**: User clicks payment button → Client calls create-checkout-session API
2. **Session Creation**: API creates Stripe session → Returns session ID to client
3. **Checkout**: Client redirects to Stripe Checkout → User completes payment
4. **Webhook Processing**: Stripe sends webhook → API verifies signature → Saves to Firestore → Sends email
5. **Success Redirect**: User redirected to success page → Displays purchase history

### Security Model

- **Client-Side**: Only public environment variables (NEXT_PUBLIC_*) accessible
- **Server-Side**: Private keys isolated in server configuration object
- **API Routes**: Firebase ID token verification for authentication
- **Webhooks**: Stripe signature verification for authenticity
- **Database**: Firebase Admin SDK with service account credentials

## Components and Interfaces

### Configuration System

**File**: `lib/config.js`

```javascript
const config = {
  public: {
    stripe: { publishableKey: string },
    firebase: { /* client config */ },
    unsplash: { accessKey: string }
  },
  server: {
    stripe: { secretKey: string, webhookSecret: string },
    firebaseAdmin: { /* admin credentials */ },
    email: { /* SMTP config */ },
    unsplash: { secretKey: string }
  }
}
```

**Purpose**: Centralized configuration management with clear separation between client-safe and server-only variables.

### Firebase Integration

**Client SDK** (`lib/firebaseClient.js`):
- Initializes Firebase app with public configuration
- Provides authentication and Firestore client access
- Used for user login/signup and client-side data access

**Admin SDK** (`lib/firebaseAdmin.js`):
- Initializes with service account credentials from environment
- Handles server-side database operations
- Used for secure payment record storage

### Stripe Integration

**Client SDK** (`lib/stripe.js`):
- Loads Stripe.js with publishable key
- Handles checkout session redirection
- Provides client-side payment utilities

**Server SDK** (API routes):
- Uses secret key for session creation
- Handles webhook signature verification
- Processes payment completion events

### API Routes

**Create Checkout Session** (`/api/create-checkout-session`):
- Verifies Firebase ID token
- Creates Stripe checkout session for $49.99 AUD
- Returns session ID for client redirection

**Stripe Webhook** (`/api/stripe-webhook`):
- Verifies webhook signature
- Processes checkout.session.completed events
- Saves purchase data to Firestore
- Sends confirmation email via Nodemailer

### Email Service

**Integration**: Nodemailer with SMTP credentials
**Trigger**: Successful payment webhook processing
**Content**: Transaction confirmation with details
**Error Handling**: Non-blocking failures with logging

### Success Page

**Authentication**: Requires user login
**Data Source**: Firestore purchase history
**Display**: User's transaction history and confirmation

## Data Models

### Purchase Record (Firestore)

```typescript
interface PurchaseRecord {
  id: string;                    // Firestore document ID
  userId: string;                // Firebase user UID
  userEmail: string;             // User's email address
  stripeSessionId: string;       // Stripe checkout session ID
  stripePaymentIntentId: string; // Stripe payment intent ID
  amount: number;                // Payment amount in cents
  currency: string;              // Currency code (AUD)
  status: 'completed' | 'pending' | 'failed';
  createdAt: Timestamp;          // Purchase timestamp
  updatedAt: Timestamp;          // Last update timestamp
  metadata?: {                   // Additional payment metadata
    productName: string;
    description: string;
  };
}
```

**Collection**: `purchases`
**Indexing**: Compound index on `userId` and `createdAt` for efficient queries
**Security Rules**: Users can only read their own purchase records

### User Profile Enhancement

```typescript
interface UserProfile {
  uid: string;
  email: string;
  premium: boolean;              // Existing field
  purchaseHistory?: string[];    // Array of purchase record IDs
  lastPurchaseDate?: Timestamp;  // Most recent purchase
  totalSpent?: number;           // Lifetime spending in cents
}
```

### Email Template Data

```typescript
interface EmailData {
  userEmail: string;
  userName?: string;
  transactionId: string;
  amount: string;               // Formatted amount with currency
  purchaseDate: string;         // Formatted date
  productName: string;
  receiptUrl?: string;          // Stripe receipt URL
}
```

## Error Handling

### Client-Side Error Handling

**Payment Initiation Errors**:
- Network failures: Retry with exponential backoff
- Authentication errors: Redirect to login
- Session creation failures: Display user-friendly error message

**Stripe Checkout Errors**:
- Payment failures: Handled by Stripe's UI
- Network issues: Stripe's built-in retry logic
- User cancellation: Redirect to cancel URL

### Server-Side Error Handling

**API Route Errors**:
- Authentication failures: Return 401 with clear message
- Stripe API errors: Log details, return generic error to client
- Database errors: Implement retry logic, fallback gracefully

**Webhook Processing Errors**:
- Signature verification failures: Return 400, log security event
- Database write failures: Retry once, then log for manual resolution
- Email sending failures: Log error but don't fail webhook processing

### Error Recovery Strategies

**Idempotency**: Webhook processing uses Stripe event IDs to prevent duplicate processing
**Retry Logic**: Database operations retry once on failure
**Graceful Degradation**: Email failures don't prevent payment completion
**Monitoring**: All errors logged with sufficient detail for debugging

## Testing Strategy

### Unit Testing

**Configuration Loading**:
- Test environment variable parsing
- Verify client/server separation
- Test missing variable handling

**Firebase Integration**:
- Mock Firebase Admin SDK initialization
- Test authentication token verification
- Verify Firestore operations

**Stripe Integration**:
- Mock Stripe SDK calls
- Test session creation with various inputs
- Verify webhook signature validation

### Integration Testing

**Payment Flow**:
- End-to-end payment simulation
- Webhook processing verification
- Database state validation
- Email delivery confirmation

**Error Scenarios**:
- Invalid authentication tokens
- Malformed webhook payloads
- Database connection failures
- Email service unavailability

### Security Testing

**Environment Variable Exposure**:
- Verify no server secrets in client bundles
- Test configuration access patterns
- Validate environment separation

**Authentication**:
- Test token verification edge cases
- Verify unauthorized access prevention
- Test session hijacking protection

**Webhook Security**:
- Test signature verification with invalid signatures
- Verify replay attack prevention
- Test malformed payload handling

### Performance Testing

**API Response Times**:
- Checkout session creation under load
- Webhook processing latency
- Database query performance

**Concurrent Operations**:
- Multiple simultaneous payments
- Webhook processing race conditions
- Database write conflicts

## Deployment Considerations

### Environment Variables

**Vercel Configuration**:
All environment variables must be configured in Vercel dashboard:

```bash
# Public (client-accessible)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=...

# Private (server-only)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM=...
UNSPLASH_SECRET_KEY=...
```

### Stripe Configuration

**Webhook Endpoint**: Configure in Stripe Dashboard
- URL: `https://yourdomain.com/api/stripe-webhook`
- Events: `checkout.session.completed`
- Signing secret: Copy to `STRIPE_WEBHOOK_SECRET`

**Product Setup**: Create product and price in Stripe Dashboard
- Price: $49.99 AUD
- Type: One-time payment
- Copy price ID for checkout session creation

### Firebase Configuration

**Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /purchases/{purchaseId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if false; // Only server can write
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Indexes**: Create composite index for efficient purchase queries
- Collection: `purchases`
- Fields: `userId` (Ascending), `createdAt` (Descending)

### Monitoring and Logging

**Error Tracking**: Implement structured logging for:
- Payment processing errors
- Webhook processing failures
- Email delivery issues
- Authentication failures

**Metrics**: Monitor key performance indicators:
- Payment success rate
- Webhook processing latency
- Email delivery rate
- API response times

**Alerts**: Set up alerts for:
- High error rates
- Webhook processing failures
- Database connection issues
- Email service outages