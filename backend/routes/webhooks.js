const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Webhook endpoint for Stripe events
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Note: In production, you should verify the webhook signature
    // For now, we'll parse the event directly
    event = JSON.parse(req.body);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received webhook event:', event.type);

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object);
        break;
      case 'invoice.updated':
        await handleInvoiceUpdated(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Invoice payment succeeded:', invoice.id);

  try {
    // Update local invoice record if it exists
    await updateInvoiceStatus(invoice.id, 'paid', {
      payment_intent: invoice.payment_intent,
      paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
      amount_paid: invoice.amount_paid / 100, // Convert from cents
    });

    // You could also trigger notifications, email confirmations, etc.
    console.log(`Invoice ${invoice.id} marked as paid`);
  } catch (error) {
    console.error('Error updating invoice payment status:', error);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id);

  try {
    await updateInvoiceStatus(invoice.id, 'payment_failed', {
      last_payment_error: invoice.last_payment_error,
      payment_attempt_count: invoice.attempt_count,
    });

    console.log(`Invoice ${invoice.id} marked as payment failed`);
  } catch (error) {
    console.error('Error updating invoice payment failure:', error);
  }
}

// Handle invoice finalization
async function handleInvoiceFinalized(invoice) {
  console.log('Invoice finalized:', invoice.id);

  try {
    await updateInvoiceStatus(invoice.id, 'open', {
      finalized_at: new Date(invoice.status_transitions.finalized_at * 1000).toISOString(),
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
    });

    console.log(`Invoice ${invoice.id} finalized and ready for payment`);
  } catch (error) {
    console.error('Error updating invoice finalization:', error);
  }
}

// Handle invoice updates
async function handleInvoiceUpdated(invoice) {
  console.log('Invoice updated:', invoice.id);

  try {
    await updateInvoiceStatus(invoice.id, invoice.status, {
      updated_at: new Date().toISOString(),
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
  }
}

// Handle successful payment intent
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  try {
    // Find invoice by payment intent ID
    const invoice = await findInvoiceByPaymentIntent(paymentIntent.id);
    if (invoice) {
      await updateInvoiceStatus(invoice.stripe_invoice_id, 'paid', {
        payment_intent: paymentIntent.id,
        paid_at: new Date().toISOString(),
        amount_paid: paymentIntent.amount_received / 100,
      });
    }
  } catch (error) {
    console.error('Error handling payment intent success:', error);
  }
}

// Handle failed payment intent
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);

  try {
    const invoice = await findInvoiceByPaymentIntent(paymentIntent.id);
    if (invoice) {
      await updateInvoiceStatus(invoice.stripe_invoice_id, 'payment_failed', {
        last_payment_error: paymentIntent.last_payment_error,
        payment_intent: paymentIntent.id,
      });
    }
  } catch (error) {
    console.error('Error handling payment intent failure:', error);
  }
}

// Helper function to update invoice status in local database
async function updateInvoiceStatus(stripeInvoiceId, status, additionalData = {}) {
  return new Promise((resolve, reject) => {
    // First, try to find if we have this invoice in our local database
    db.get('SELECT id FROM invoices WHERE stripe_invoice_id = ?', [stripeInvoiceId], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        // Update existing invoice
        const updateData = {
          status,
          updated_at: new Date().toISOString(),
          ...additionalData,
        };

        const setClause = Object.keys(updateData)
          .map((key) => `${key} = ?`)
          .join(', ');
        const values = Object.values(updateData);
        values.push(row.id);

        db.run(`UPDATE invoices SET ${setClause} WHERE id = ?`, values, function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
      } else {
        // Invoice not in our database, could create a record or just log
        console.log(`Invoice ${stripeInvoiceId} not found in local database, skipping update`);
        resolve(0);
      }
    });
  });
}

// Helper function to find invoice by payment intent
async function findInvoiceByPaymentIntent(paymentIntentId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM invoices WHERE payment_intent = ?', [paymentIntentId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = router;
