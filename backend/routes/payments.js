const express = require('express');
const { body, validationResult } = require('express-validator');
const { stripe } = require('../stripe-config');

const router = express.Router();

/**
 * Create Stripe Checkout Session for Operandi Challenge
 * POST /api/payments/create-checkout-session
 */
router.post(
  '/create-checkout-session',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('promoCode').notEmpty().withMessage('Promo code is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, firstName, lastName, promoCode } = req.body;

      // Validate promo code
      if (promoCode !== 'OPERANDI2024') {
        return res.status(400).json({
          error: 'Invalid promo code',
        });
      }

      // Calculate pricing
      const basePrice = 99; // $99/month base price
      const discount = 10; // $10 discount with promo code
      const finalPrice = basePrice - discount; // $89

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: '100K Tracker - Operandi Challenge',
                description: 'Monthly subscription with Operandi Challenge access (includes $10 Operandi discount)',
              },
              unit_amount: finalPrice * 100, // Convert to cents ($89)
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          firstName,
          lastName,
          promoCode,
          subscriptionTier: 'operandi',
          originalPrice: basePrice,
          discountAmount: discount,
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/operandi-challenge?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/operandi-challenge?payment=cancelled`,
      });

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({
        error: 'Failed to create checkout session',
        message: error.message,
      });
    }
  },
);

/**
 * Handle successful payment
 * POST /api/payments/success
 */
router.post('/success', [body('sessionId').notEmpty().withMessage('Session ID is required')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { sessionId } = req.body;

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Payment was successful
      // Here you would typically:
      // 1. Create user account or update existing user
      // 2. Assign subscription
      // 3. Send welcome email

      const customerEmail = session.customer_email;
      const metadata = session.metadata;

      res.json({
        success: true,
        message: 'Payment successful',
        customer: {
          email: customerEmail,
          firstName: metadata.firstName,
          lastName: metadata.lastName,
          subscriptionTier: metadata.subscriptionTier,
        },
      });
    } else {
      res.status(400).json({
        error: 'Payment not completed',
        status: session.payment_status,
      });
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({
      error: 'Failed to process payment confirmation',
      message: error.message,
    });
  }
});

module.exports = router;
