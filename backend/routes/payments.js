const express = require('express');
const { body, validationResult } = require('express-validator');
const { client, SQUARE_CONFIG, paymentsApi, customersApi, ordersApi } = require('../square-config');
const crypto = require('crypto');

// Generate UUID v4 using crypto module (Node.js built-in)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const router = express.Router();

/**
 * Create Square Payment Link for Operandi Challenge
 * POST /api/payments/create-checkout-session
 */
router.post(
  '/create-checkout-session',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('selectedPlan').isIn(['monthly', 'yearly']).withMessage('Valid plan selection is required'),
    body('promoCode').optional().isString().withMessage('Promo code must be a string'),
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

      const { email, firstName, lastName, selectedPlan, promoCode } = req.body;

      // Validate promo code if provided
      const hasValidPromo = promoCode && promoCode.trim().toUpperCase() === 'OPERANDI2024';

      if (promoCode && promoCode.trim() && !hasValidPromo) {
        return res.status(400).json({
          error: 'Invalid promo code',
        });
      }

      // Calculate pricing based on plan and promo code
      const basePrice = selectedPlan === 'monthly' ? 98 : 980;
      const discount = hasValidPromo ? (selectedPlan === 'monthly' ? 10 : 130) : 0;
      const finalPrice = basePrice - discount;

      // Only include promo-related metadata if a promo code was actually submitted
      const promoMetadata =
        promoCode && promoCode.trim()
          ? {
              promoCode: promoCode.trim(),
              hasValidPromo: hasValidPromo.toString(),
              discountAmount: discount.toString(),
            }
          : {
              // Include discount amount even without promo for consistency
              discountAmount: discount.toString(),
            };

      // Create or get customer
      let customerId;
      try {
        // Search for existing customer by email
        const searchResult = await customersApi.search({
          filter: {
            emailAddress: {
              exact: email,
            },
          },
        });

        if (searchResult.customers && searchResult.customers.length > 0) {
          customerId = searchResult.customers[0].id;
          console.log('Found existing customer:', customerId);
        } else {
          // Create new customer
          const createResult = await customersApi.create({
            givenName: firstName,
            familyName: lastName,
            emailAddress: email,
          });
          customerId = createResult.customer.id;
          console.log('Created new customer:', customerId);
        }
      } catch (customerError) {
        console.error('Error handling customer:', customerError);

        // Handle authentication errors specifically
        if (customerError.statusCode === 401) {
          return res.status(500).json({
            error: 'Square authentication failed',
            message: 'Access token authentication failed. This could be due to invalid token or missing permissions.',
            details: {
              code: customerError.errors?.[0]?.code || 'UNAUTHORIZED',
              category: customerError.errors?.[0]?.category || 'AUTHENTICATION_ERROR',
              possibleCauses: [
                'Token is invalid or expired',
                'Missing required OAuth permissions',
                'Token not generated for sandbox environment',
              ],
              requiredPermissions: [
                'MERCHANT_PROFILE_READ (for locations)',
                'CUSTOMERS_READ (for customer search)',
                'CUSTOMERS_WRITE (for customer creation)',
                'ORDERS_READ (for order retrieval)',
                'ORDERS_WRITE (for order creation)',
                'PAYMENTS_READ (for payment status)',
                'PAYMENTS_WRITE (for payment processing)',
              ],
              instructions: [
                '1. Go to Square Developer Console',
                '2. Select your application',
                '3. Go to Sandbox environment',
                '4. Go to OAuth section and add missing permissions above',
                '5. Generate a new access token',
                '6. Update SQUARE_ACCESS_TOKEN in your .env file',
                '7. Restart the server',
              ],
            },
          });
        }

        return res.status(500).json({
          error: 'Failed to create/find customer',
          message: customerError.message,
        });
      }

      // Create payment link using Square's Checkout API
      // For now, we'll create a simple order and return a hosted checkout URL
      // In production, you'd want to implement the Web Payments SDK on frontend

      // First, create an order
      const orderRequest = {
        idempotencyKey: generateUUID(),
        order: {
          locationId: process.env.SQUARE_LOCATION_ID || '', // This needs to be set in production
          lineItems: [
            {
              name: `100K Tracker - ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan`,
              quantity: '1',
              note: `${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} subscription${hasValidPromo ? ' with Operandi discount' : ''}`,
              basePriceMoney: {
                amount: BigInt(finalPrice * 100), // Convert to cents as BigInt
                currency: 'USD',
              },
            },
          ],
          metadata: {
            firstName,
            lastName,
            email,
            selectedPlan,
            basePrice: basePrice.toString(),
            customerId,
            ...promoMetadata,
          },
        },
      };

      const orderResult = await ordersApi.create(orderRequest);
      const orderId = orderResult.order.id;

      console.log('Created Square order:', orderId);

      // For now, return order information that frontend can use
      // In a full implementation, you'd create a payment link or use Web Payments SDK
      res.json({
        success: true,
        orderId: orderId,
        customerId: customerId,
        amount: finalPrice,
        currency: 'USD',
        // Note: In production, you'd need to implement proper payment collection
        // This is a simplified response for development
        message: 'Order created successfully. Payment collection needs to be implemented.',
        details: {
          plan: selectedPlan,
          basePrice: basePrice,
          discount: discount,
          finalPrice: finalPrice,
          hasValidPromo: hasValidPromo,
        },
      });
    } catch (error) {
      console.error('Error creating Square payment link:', error);
      res.status(500).json({
        error: 'Failed to create payment link',
        message: error.message,
        details: error.errors || [],
      });
    }
  },
);

/**
 * Process Square Payment for existing order
 * POST /api/payments/process-payment
 */
router.post(
  '/process-payment',
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('paymentToken').notEmpty().withMessage('Payment token is required'),
    body('amount').isNumeric().withMessage('Amount is required'),
    body('idempotencyKey').notEmpty().withMessage('Idempotency key is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { orderId, paymentToken, amount, idempotencyKey } = req.body;

      // Get order details first
      const orderResult = await ordersApi.get({
        orderId: orderId,
      });
      if (!orderResult.order) {
        return res.status(404).json({
          error: 'Order not found',
        });
      }

      const order = orderResult.order;

      // Create payment using Square Payments API
      const paymentRequest = {
        idempotencyKey,
        sourceId: paymentToken,
        amountMoney: {
          amount: BigInt(amount), // Amount in cents
          currency: 'USD',
        },
        orderId: orderId,
        autocomplete: true, // Automatically complete the payment
        locationId: process.env.SQUARE_LOCATION_ID,
        note: `Payment for 100K Tracker subscription - Order ${orderId}`,
      };

      console.log('Processing Square payment:', {
        orderId,
        amount,
        idempotencyKey: idempotencyKey.substring(0, 8) + '...',
      });

      const paymentResult = await paymentsApi.create(paymentRequest);

      if (paymentResult.payment) {
        const payment = paymentResult.payment;
        console.log('Payment created successfully:', payment.id);

        res.json({
          success: true,
          paymentId: payment.id,
          message: 'Payment processed successfully',
          payment: {
            id: payment.id,
            status: payment.status,
            orderId: payment.orderId,
            amountMoney: payment.amountMoney
              ? {
                  amount: Number(payment.amountMoney.amount), // Convert BigInt to Number
                  currency: payment.amountMoney.currency,
                }
              : null,
            createdAt: payment.createdAt,
          },
        });
      } else {
        throw new Error('Payment creation failed - no payment object returned');
      }
    } catch (error) {
      console.error('Error processing Square payment:', error);

      // Handle specific Square payment errors
      if (error.statusCode && error.body && error.body.errors) {
        const squareError = error.body.errors[0];
        return res.status(400).json({
          success: false,
          error: 'Payment failed',
          message: squareError.detail || 'Payment processing failed',
          code: squareError.code,
          category: squareError.category,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Payment processing failed',
        message: error.message,
      });
    }
  },
);

/**
 * Handle successful payment (updated for Square)
 * POST /api/payments/success
 */
router.post('/success', [body('orderId').notEmpty().withMessage('Order ID is required')], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { orderId } = req.body;

    // Retrieve the order details
    const orderResult = await ordersApi.get({
      orderId: orderId,
    });

    if (!orderResult.order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    const order = orderResult.order;
    const metadata = order.metadata || {};

    // Extract customer information from metadata
    const customerEmail = metadata.email;
    const firstName = metadata.firstName;
    const lastName = metadata.lastName;
    const selectedPlan = metadata.selectedPlan;
    const customerId = metadata.customerId;

    // Here you would typically:
    // 1. Verify the payment was actually completed through webhooks
    // 2. Create user account or update existing user
    // 3. Assign subscription
    // 4. Send welcome email
    // 5. Store Square customer ID and subscription details

    console.log('Processing order completion for:', customerEmail);

    res.json({
      success: true,
      message: 'Order processed successfully',
      customer: {
        email: customerEmail,
        firstName: firstName,
        lastName: lastName,
        subscriptionTier: selectedPlan === 'monthly' ? 'monthly' : 'yearly',
        squareCustomerId: customerId,
      },
      order: {
        id: orderId,
        state: order.state,
        totalMoney: order.totalMoney
          ? {
              amount: Number(order.totalMoney.amount), // Convert BigInt to Number
              currency: order.totalMoney.currency,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error handling Square order completion:', error);
    res.status(500).json({
      error: 'Failed to process order completion',
      message: error.message,
      details: error.errors || [],
    });
  }
});

module.exports = router;
