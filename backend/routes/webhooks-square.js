const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { db, getDb, initDB } = require('../db');
const { SQUARE_CONFIG } = require('../square-config');

// Database wrapper functions for webhook operations
async function getInitializedDb() {
  const currentDb = getDb();
  if (currentDb) {
    return currentDb;
  }
  await initDB();
  return getDb();
}

async function dbGet(query, params = []) {
  const currentDb = await getInitializedDb();
  return new Promise((resolve, reject) => {
    currentDb.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function dbRun(query, params = []) {
  const currentDb = await getInitializedDb();
  return new Promise((resolve, reject) => {
    currentDb.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Webhook endpoint for Square events
router.post('/square', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-square-signature'];
  let event;

  try {
    // Verify webhook signature if signature key is configured
    if (SQUARE_CONFIG.webhookSignatureKey && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', SQUARE_CONFIG.webhookSignatureKey)
        .update(req.body)
        .digest('base64');

      if (signature !== expectedSignature) {
        console.error('Square webhook signature verification failed');
        return res.status(400).send('Webhook signature verification failed');
      }
    }

    // Parse the event
    event = JSON.parse(req.body);
  } catch (err) {
    console.error('Square webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Square webhook event:', event.type);

  try {
    // Handle the event
    switch (event.type) {
      case 'payment.created':
        await handlePaymentCreated(event.data.object);
        break;
      case 'payment.updated':
        await handlePaymentUpdated(event.data.object);
        break;
      case 'order.created':
        await handleOrderCreated(event.data.object);
        break;
      case 'order.updated':
        await handleOrderUpdated(event.data.object);
        break;
      case 'order.fulfillment.updated':
        await handleOrderFulfillmentUpdated(event.data.object);
        break;
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object);
        break;
      case 'invoice.updated':
        await handleInvoiceUpdated(event.data.object);
        break;
      case 'invoice.payment_made':
        await handleInvoicePaymentMade(event.data.object);
        break;
      default:
        console.log(`Unhandled Square event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Square webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Legacy Stripe webhook endpoint (kept for backward compatibility during transition)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('Received legacy Stripe webhook - redirecting to Square handler or ignoring');

  // For now, we'll just acknowledge receipt and log
  // In production, you might want to handle any remaining Stripe events
  res.json({ received: true, message: 'Legacy Stripe webhook acknowledged' });
});

// Square webhook event handlers
async function handlePaymentCreated(payment) {
  console.log('Processing Square payment.created event:', payment.id);

  try {
    // Extract order information and customer details
    const orderId = payment.order_id;
    const amount = payment.amount_money ? payment.amount_money.amount : 0;
    const currency = payment.amount_money ? payment.amount_money.currency : 'USD';

    console.log(`Payment created for order ${orderId}: ${amount} ${currency}`);

    // Here you would typically:
    // 1. Update order status in your database
    // 2. Send confirmation emails
    // 3. Update user subscription status
  } catch (error) {
    console.error('Error handling payment.created:', error);
    throw error;
  }
}

async function handlePaymentUpdated(payment) {
  console.log('Processing Square payment.updated event:', payment.id);

  try {
    if (payment.status === 'COMPLETED') {
      // Payment completed successfully
      await handlePaymentCompleted(payment);
    } else if (payment.status === 'FAILED') {
      // Payment failed
      await handlePaymentFailed(payment);
    }
  } catch (error) {
    console.error('Error handling payment.updated:', error);
    throw error;
  }
}

async function handlePaymentCompleted(payment) {
  console.log('Processing completed payment:', payment.id);

  try {
    // Extract order ID and look up metadata
    const orderId = payment.order_id;

    // Here you would:
    // 1. Find the user associated with this payment
    // 2. Activate their subscription
    // 3. Send welcome emails
    // 4. Update database records

    console.log(`Payment ${payment.id} completed for order ${orderId}`);
  } catch (error) {
    console.error('Error handling completed payment:', error);
    throw error;
  }
}

async function handlePaymentFailed(payment) {
  console.log('Processing failed payment:', payment.id);

  try {
    // Handle failed payment - notify user, update status, etc.
    console.log(`Payment ${payment.id} failed`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}

async function handleOrderCreated(order) {
  console.log('Processing Square order.created event:', order.id);

  try {
    // Handle new order creation
    const metadata = order.metadata || {};
    const customerEmail = metadata.email;

    if (customerEmail) {
      console.log(`Order created for customer: ${customerEmail}`);
    }
  } catch (error) {
    console.error('Error handling order.created:', error);
    throw error;
  }
}

async function handleOrderUpdated(order) {
  console.log('Processing Square order.updated event:', order.id);

  try {
    // Handle order updates - status changes, fulfillment, etc.
    console.log(`Order ${order.id} updated to state: ${order.state}`);
  } catch (error) {
    console.error('Error handling order.updated:', error);
    throw error;
  }
}

async function handleOrderFulfillmentUpdated(fulfillment) {
  console.log('Processing Square order.fulfillment.updated event');

  try {
    // Handle fulfillment updates
    console.log('Order fulfillment updated:', fulfillment);
  } catch (error) {
    console.error('Error handling order.fulfillment.updated:', error);
    throw error;
  }
}

async function handleInvoiceCreated(invoice) {
  console.log('Processing Square invoice.created event:', invoice.id);

  try {
    // Handle new invoice creation
    console.log(`Invoice created: ${invoice.id}`);
  } catch (error) {
    console.error('Error handling invoice.created:', error);
    throw error;
  }
}

async function handleInvoiceUpdated(invoice) {
  console.log('Processing Square invoice.updated event:', invoice.id);

  try {
    // Handle invoice updates
    console.log(`Invoice updated: ${invoice.id}`);
  } catch (error) {
    console.error('Error handling invoice.updated:', error);
    throw error;
  }
}

async function handleInvoicePaymentMade(invoice) {
  console.log('Processing Square invoice.payment_made event:', invoice.id);

  try {
    // Handle invoice payment completion
    console.log(`Payment made for invoice: ${invoice.id}`);

    // Similar to payment completion:
    // 1. Update user subscription
    // 2. Send confirmation
    // 3. Activate services
  } catch (error) {
    console.error('Error handling invoice.payment_made:', error);
    throw error;
  }
}

module.exports = router;
