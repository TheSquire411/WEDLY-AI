/**
 * Email Notification System
 * 
 * This module provides email functionality for the Stripe payment system,
 * including purchase confirmation emails sent via Nodemailer with SMTP.
 */

import nodemailer from 'nodemailer';
import { getServerConfig } from './config.js';

/**
 * Email template data interface
 */
export interface EmailData {
  userEmail: string;
  userName?: string;
  transactionId: string;
  amount: string;
  purchaseDate: string;
  productName?: string;
  receiptUrl?: string;
}

/**
 * Email sending result interface
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  userEmail: string;
  transactionId: string;
  duration: number;
  response?: string;
  error?: string;
}

/**
 * Email configuration test result interface
 */
export interface EmailTestResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Create and configure Nodemailer transporter
 * @returns Configured email transporter
 */
function createEmailTransporter(): nodemailer.Transporter {
  const emailConfig = (getServerConfig() as any).email;
  
  if (!emailConfig.host || !emailConfig.user || !emailConfig.pass) {
    throw new Error('Email configuration is incomplete. Please check EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
  }

  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure, // true for 465, false for other ports
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass,
    },
    // Additional security options
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates in development
    },
  });
}

/**
 * Generate HTML email template for purchase confirmation
 * @param emailData - Email template data
 * @returns HTML email content
 */
function generateEmailTemplate(emailData: EmailData): string {
  const {
    userEmail,
    userName = 'Valued Customer',
    transactionId,
    amount,
    purchaseDate,
    productName = 'Wedly Service',
    receiptUrl
  } = emailData;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Purchase Confirmation - Wedly</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .email-container {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .success-icon {
          font-size: 48px;
          color: #28a745;
          margin-bottom: 15px;
        }
        .title {
          font-size: 24px;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6c757d;
          font-size: 16px;
        }
        .details-section {
          margin: 30px 0;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #28a745;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 5px 0;
        }
        .detail-label {
          font-weight: 600;
          color: #495057;
        }
        .detail-value {
          color: #2c3e50;
          font-weight: 500;
        }
        .amount {
          font-size: 20px;
          font-weight: bold;
          color: #28a745;
        }
        .receipt-button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }
        .support-info {
          margin-top: 20px;
          padding: 15px;
          background-color: #e3f2fd;
          border-radius: 6px;
          font-size: 14px;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .email-container {
            padding: 20px;
          }
          .detail-row {
            flex-direction: column;
            gap: 5px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">Wedly</div>
          <div class="success-icon">✅</div>
          <h1 class="title">Payment Confirmed!</h1>
          <p class="subtitle">Thank you for your purchase</p>
        </div>

        <div class="content">
          <p>Hi ${userName},</p>
          <p>We're excited to confirm that your payment has been successfully processed. Here are the details of your purchase:</p>

          <div class="details-section">
            <div class="detail-row">
              <span class="detail-label">Product:</span>
              <span class="detail-value">${productName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value amount">${amount}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction ID:</span>
              <span class="detail-value">${transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Purchase Date:</span>
              <span class="detail-value">${purchaseDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${userEmail}</span>
            </div>
          </div>

          ${receiptUrl ? `
            <div style="text-align: center;">
              <a href="${receiptUrl}" class="receipt-button">View Receipt</a>
            </div>
          ` : ''}

          <p>Your purchase has been recorded in your account, and you can view your purchase history anytime by logging into your Wedly account.</p>

          <div class="support-info">
            <strong>Need Help?</strong><br>
            If you have any questions about your purchase or need assistance, please don't hesitate to contact our support team. We're here to help!
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing Wedly!</p>
          <p>This email was sent to ${userEmail}</p>
          <p style="margin-top: 15px; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text version of the email for better compatibility
 * @param emailData - Email template data
 * @returns Plain text email content
 */
function generatePlainTextTemplate(emailData: EmailData): string {
  const {
    userEmail,
    userName = 'Valued Customer',
    transactionId,
    amount,
    purchaseDate,
    productName = 'Wedly Service',
    receiptUrl
  } = emailData;

  return `
WEDLY - PAYMENT CONFIRMATION

Hi ${userName},

We're excited to confirm that your payment has been successfully processed!

PURCHASE DETAILS:
- Product: ${productName}
- Amount: ${amount}
- Transaction ID: ${transactionId}
- Purchase Date: ${purchaseDate}
- Email: ${userEmail}

${receiptUrl ? `View your receipt: ${receiptUrl}` : ''}

Your purchase has been recorded in your account, and you can view your purchase history anytime by logging into your Wedly account.

NEED HELP?
If you have any questions about your purchase or need assistance, please don't hesitate to contact our support team. We're here to help!

Thank you for choosing Wedly!

---
This email was sent to ${userEmail}
This is an automated message. Please do not reply to this email.
  `.trim();
}

/**
 * Send purchase confirmation email
 * @param emailData - Email data object
 * @returns Promise<EmailResult> Email sending result
 */
export async function sendPurchaseConfirmationEmail(emailData: EmailData): Promise<EmailResult> {
  const startTime = Date.now();
  
  try {
    // Validate required email data
    if (!emailData.userEmail) {
      throw new Error('User email is required for sending confirmation email');
    }
    
    if (!emailData.transactionId) {
      throw new Error('Transaction ID is required for sending confirmation email');
    }
    
    if (!emailData.amount) {
      throw new Error('Amount is required for sending confirmation email');
    }

    // Get email configuration
    const emailConfig = (getServerConfig() as any).email;
    
    // Create transporter
    const transporter = createEmailTransporter();
    
    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError: any) {
      console.error('❌ Email transporter verification failed:', {
        error: verifyError.message,
        stack: verifyError.stack,
        code: verifyError.code
      });
      throw new Error(`Email service configuration error: ${verifyError.message}`);
    }

    // Generate email content
    const htmlContent = generateEmailTemplate(emailData);
    const textContent = generatePlainTextTemplate(emailData);
    
    // Prepare email options
    const mailOptions = {
      from: {
        name: 'Wedly',
        address: emailConfig.from
      },
      to: emailData.userEmail,
      subject: `Payment Confirmation - ${emailData.productName || 'Wedly Service'} - ${emailData.transactionId}`,
      html: htmlContent,
      text: textContent,
      // Additional headers for better deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      },
      // Message ID for tracking
      messageId: `purchase-${emailData.transactionId}@wedly.com`
    };

    // Send email
    console.log(`📧 Sending purchase confirmation email to ${emailData.userEmail} for transaction ${emailData.transactionId}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Purchase confirmation email sent successfully in ${duration}ms:`, {
      messageId: result.messageId,
      userEmail: emailData.userEmail,
      transactionId: emailData.transactionId,
      response: result.response,
      duration
    });

    return {
      success: true,
      messageId: result.messageId,
      userEmail: emailData.userEmail,
      transactionId: emailData.transactionId,
      duration,
      response: result.response
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ Failed to send purchase confirmation email after ${duration}ms:`, {
      error: error.message,
      stack: error.stack,
      userEmail: emailData.userEmail,
      transactionId: emailData.transactionId,
      duration,
      emailConfig: {
        host: (getServerConfig() as any).email.host,
        port: (getServerConfig() as any).email.port,
        user: (getServerConfig() as any).email.user,
        from: (getServerConfig() as any).email.from
      }
    });

    return {
      success: false,
      error: error.message,
      userEmail: emailData.userEmail,
      transactionId: emailData.transactionId,
      duration
    };
  }
}

/**
 * Test email configuration and connectivity
 * @returns Promise<EmailTestResult> Test result
 */
export async function testEmailConfiguration(): Promise<EmailTestResult> {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: 'Email configuration is valid and SMTP server is reachable'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      message: 'Email configuration test failed'
    };
  }
}

/**
 * Format currency amount for display
 * @param amountInCents - Amount in cents
 * @param currency - Currency code (default: AUD)
 * @returns Formatted amount string
 */
export function formatCurrency(amountInCents: number, currency: string = 'AUD'): string {
  const amount = amountInCents / 100;
  
  try {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    return `${currency} $${amount.toFixed(2)}`;
  }
}

/**
 * Format date for email display
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatEmailDate(date: Date | string): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Australia/Sydney'
    }).format(dateObj);
  } catch (error) {
    // Fallback formatting
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleString('en-AU');
  }
}

// Default export for backward compatibility
export default {
  sendPurchaseConfirmationEmail,
  testEmailConfiguration,
  formatCurrency,
  formatEmailDate
};