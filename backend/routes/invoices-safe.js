const express = require('express');
const router = express.Router();
const { db, getDb, initDB } = require('../db');
const { authenticateJWT } = require('../middleware');

// Helper function to get initialized database connection
async function getInitializedDb() {
  let currentDb = getDb();
  if (!currentDb) {
    await initDB();
    currentDb = getDb();
    if (!currentDb) {
      throw new Error('Failed to initialize database');
    }
  }
  return currentDb;
}

// Database wrapper functions with proper initialization
async function dbGet(query, params) {
  const currentDb = await getInitializedDb();
  return new Promise((resolve, reject) => {
    currentDb.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function dbAll(query, params) {
  const currentDb = await getInitializedDb();
  return new Promise((resolve, reject) => {
    currentDb.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function dbRun(query, params) {
  const currentDb = await getInitializedDb();
  return new Promise((resolve, reject) => {
    currentDb.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Function to get user's Stripe configuration
async function getUserStripeConfig(userId) {
  const currentDb = await getInitializedDb();

  return new Promise((resolve, reject) => {
    currentDb.get('SELECT stripe_secret_key, stripe_publishable_key FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Function to get contact by ID with Stripe information
async function getContactById(userId, contactId) {
  const currentDb = await getInitializedDb();

  return new Promise((resolve, reject) => {
    currentDb.get(
      `SELECT *, stripe_customer_id, stripe_payment_methods, stripe_default_payment_method 
       FROM user_contacts WHERE id = ? AND user_id = ?`,
      [contactId, userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      },
    );
  });
}

// Function to create user-specific Stripe client
function createUserStripeClient(secretKey) {
  if (!secretKey) return null;

  try {
    const stripe = require('stripe')(secretKey);
    return stripe;
  } catch (error) {
    console.error('Error creating Stripe client:', error);
    return null;
  }
}

// Test endpoint to verify routes are working
router.get('/test', authenticateJWT, (req, res) => {
  res.json({
    message: 'Invoice routes are working',
    userId: req.user.id,
    timestamp: new Date().toISOString(),
  });
});

// Get user's Stripe configuration status
router.get('/stripe-config', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserStripeConfig(userId);

    const hasStripeConfig = !!(user?.stripe_secret_key && user?.stripe_publishable_key);

    res.json({
      hasStripeConfig,
      publishableKey: user?.stripe_publishable_key || null,
      message: hasStripeConfig ? 'Stripe configured' : 'Set Stripe API Keys to use this feature',
    });
  } catch (error) {
    console.error('Error checking Stripe config:', error);
    res.status(500).json({ error: 'Failed to check Stripe configuration' });
  }
});

// Get user invoices - now with local database tracking and Stripe sync
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserStripeConfig(userId);

    if (!user?.stripe_secret_key) {
      return res.json({
        invoices: [],
        message: 'Set Stripe API Keys to use this feature',
      });
    }

    // Get invoices from local database
    const currentDb = await getInitializedDb();
    const localInvoices = await new Promise((resolve, reject) => {
      currentDb.all(
        `
        SELECT 
          i.*,
          c.first_name as contact_first_name,
          c.last_name as contact_last_name,
          c.email as contact_email
        FROM invoices i
        LEFT JOIN user_contacts c ON i.contact_id = c.id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC
      `,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });

    // Optionally sync with Stripe for latest status (for recent invoices)
    const stripe = createUserStripeClient(user.stripe_secret_key);
    if (stripe && localInvoices.length > 0) {
      // Sync recent invoices (last 10) with Stripe for real-time status
      const recentInvoices = localInvoices.slice(0, 10);

      for (const localInvoice of recentInvoices) {
        try {
          const stripeInvoice = await stripe.invoices.retrieve(localInvoice.stripe_invoice_id);

          // Update local status if it's different
          if (stripeInvoice.status !== localInvoice.status) {
            await new Promise((resolve, reject) => {
              db.run(
                'UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [stripeInvoice.status, localInvoice.id],
                function (err) {
                  if (err) reject(err);
                  else resolve();
                },
              );
            });
            localInvoice.status = stripeInvoice.status;
          }
        } catch (error) {
          console.warn(`Failed to sync invoice ${localInvoice.stripe_invoice_id}:`, error.message);
        }
      }
    }

    // Format invoices for frontend
    const formattedInvoices = localInvoices.map((invoice) => ({
      id: invoice.stripe_invoice_id,
      localId: invoice.id,
      status: invoice.status,
      total: invoice.total_amount,
      currency: invoice.currency,
      created: invoice.created_at,
      dueDate: invoice.due_date,
      paidAt: invoice.paid_at,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      customer: {
        id: invoice.stripe_customer_id,
        name:
          invoice.contact_first_name && invoice.contact_last_name
            ? `${invoice.contact_first_name} ${invoice.contact_last_name}`
            : 'Manual Customer',
        email: invoice.contact_email,
      },
      description: invoice.description,
      paymentIntent: invoice.payment_intent,
      amountPaid: invoice.amount_paid,
    }));

    res.json({
      invoices: formattedInvoices,
      total: formattedInvoices.length,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Create invoice - now with real Stripe integration and local tracking
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserStripeConfig(userId);

    if (!user?.stripe_secret_key) {
      return res.status(400).json({
        error: 'Set Stripe API Keys to use this feature',
      });
    }

    const stripe = createUserStripeClient(user.stripe_secret_key);
    if (!stripe) {
      return res.status(400).json({ error: 'Invalid Stripe configuration' });
    }

    const {
      customerInfo,
      items,
      dueDate,
      notes,
      contactId,
      existingStripeCustomerId,
      collectionMethod = 'charge_automatically', // New parameter: 'charge_automatically' or 'send_invoice'
    } = req.body;

    if (!customerInfo || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer information and items are required' });
    }

    // Validate due date requirement for send_invoice collection method
    if (collectionMethod === 'send_invoice' && !dueDate) {
      return res.status(400).json({
        error: 'If sending an invoice to the client, you must specify a due date.',
      });
    }

    // Validate email requirement for send_invoice collection method
    if (collectionMethod === 'send_invoice' && !customerInfo.email) {
      return res.status(400).json({
        error: 'If sending an invoice to the client, you must specify an email address.',
      });
    }

    // Create or retrieve customer
    let customer;

    if (existingStripeCustomerId) {
      try {
        // Try to use existing Stripe customer
        customer = await stripe.customers.retrieve(existingStripeCustomerId);

        // Update customer info if we have more details
        if (customerInfo.name || customerInfo.phone || customerInfo.address) {
          customer = await stripe.customers.update(customer.id, {
            name: customerInfo.name || customer.name,
            phone: customerInfo.phone || customer.phone,
            address: customerInfo.address || customer.address,
          });
        }
      } catch (error) {
        console.warn('Existing Stripe customer not found, creating new one:', error.message);
        existingStripeCustomerId = null;
      }
    }

    if (!existingStripeCustomerId) {
      // Look for existing customer by email or create new one
      const existingCustomers = await stripe.customers.list({
        email: customerInfo.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];

        // Update customer info if we have more details
        if (customerInfo.name || customerInfo.phone || customerInfo.address) {
          customer = await stripe.customers.update(customer.id, {
            name: customerInfo.name || customer.name,
            phone: customerInfo.phone || customer.phone,
            address: customerInfo.address || customer.address,
          });
        }
      } else {
        customer = await stripe.customers.create({
          email: customerInfo.email,
          name: customerInfo.name || undefined,
          phone: customerInfo.phone || undefined,
          address: customerInfo.address || undefined,
          description: `Customer for ${req.user.username}`,
          metadata: {
            created_by_user: userId.toString(),
            source: contactId ? 'existing_contact' : 'manual_entry',
            contact_id: contactId?.toString() || '',
          },
        });
      }

      // Update contact with new Stripe customer ID if this was from a contact
      if (contactId) {
        try {
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE user_contacts SET stripe_customer_id = ?, last_stripe_sync = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
              [customer.id, contactId, userId],
              function (err) {
                if (err) reject(err);
                else resolve();
              },
            );
          });
        } catch (error) {
          console.warn('Failed to update contact with Stripe customer ID:', error.message);
        }
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create invoice with collection method based on user choice
    const invoiceData = {
      customer: customer.id,
      description: notes || 'Invoice from 100KTracker',
      auto_advance: false, // Don't auto-finalize
      collection_method: collectionMethod, // Either 'charge_automatically' or 'send_invoice'
      metadata: {
        user_id: userId.toString(),
        contact_id: contactId?.toString() || '',
        created_via: '100ktracker',
        collection_method: collectionMethod,
      },
    };

    // Add due_date only for send_invoice collection method
    if (dueDate && collectionMethod === 'send_invoice') {
      invoiceData.due_date = Math.floor(new Date(dueDate).getTime() / 1000);
    } else if (dueDate) {
      // Store due date in metadata for charge_automatically invoices
      invoiceData.metadata.due_date = dueDate;
    }

    const invoice = await stripe.invoices.create(invoiceData);

    // Add items to invoice
    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: Math.round(item.price * 100 * item.quantity), // Total amount in cents (price * quantity)
        currency: 'usd',
        description: item.description,
        metadata: {
          watch_id: item.watch_id?.toString() || '',
          unit_price: item.price.toString(),
          quantity: item.quantity.toString(),
        },
      });
    }

    // Finalize invoice to generate hosted URL or prepare for sending
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    let responseMessage = 'Invoice created successfully';
    let hostedInvoiceUrl = finalizedInvoice.hosted_invoice_url;

    // If collection method is send_invoice, we can provide the option to send it
    if (collectionMethod === 'send_invoice') {
      responseMessage = 'Invoice created successfully. Use the "Send Invoice" button to email it to the customer.';
    } else {
      responseMessage = 'Invoice created successfully. Customer can pay immediately using the hosted invoice URL.';
    }

    // Save invoice to local database for tracking
    const localInvoiceId = await new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO invoices (
          user_id, contact_id, stripe_invoice_id, stripe_customer_id, 
          status, total_amount, currency, description, hosted_invoice_url,
          invoice_pdf, finalized_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          userId,
          contactId || null,
          finalizedInvoice.id,
          customer.id,
          finalizedInvoice.status,
          totalAmount,
          'usd',
          notes || '',
          finalizedInvoice.hosted_invoice_url,
          finalizedInvoice.invoice_pdf,
          new Date().toISOString(),
          JSON.stringify(finalizedInvoice.metadata),
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        },
      );
    });

    // Save invoice items
    for (const item of items) {
      await new Promise((resolve, reject) => {
        db.run(
          `
          INSERT INTO invoice_items (
            invoice_id, watch_id, description, quantity, unit_price, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
          [
            localInvoiceId,
            item.watch_id || null,
            item.description,
            item.quantity,
            item.price,
            item.price * item.quantity,
          ],
          function (err) {
            if (err) reject(err);
            else resolve();
          },
        );
      });
    }

    res.json({
      invoice: finalizedInvoice,
      invoiceUrl: hostedInvoiceUrl,
      customer: customer,
      localInvoiceId: localInvoiceId,
      collectionMethod: collectionMethod,
      message: responseMessage,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      details: error.message,
    });
  }
});

// Get specific invoice
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserStripeConfig(userId);

    if (!user?.stripe_secret_key) {
      return res.status(400).json({
        error: 'Set Stripe API Keys to use this feature',
      });
    }

    const stripe = createUserStripeClient(user.stripe_secret_key);
    if (!stripe) {
      return res.status(400).json({ error: 'Invalid Stripe configuration' });
    }

    const invoice = await stripe.invoices.retrieve(req.params.id);
    res.json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Send invoice
router.post('/:id/send', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserStripeConfig(userId);

    if (!user?.stripe_secret_key) {
      return res.status(400).json({
        error: 'Set Stripe API Keys to use this feature',
      });
    }

    const stripe = createUserStripeClient(user.stripe_secret_key);
    if (!stripe) {
      return res.status(400).json({ error: 'Invalid Stripe configuration' });
    }

    const invoice = await stripe.invoices.sendInvoice(req.params.id);
    res.json({ invoice, message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

// Void invoice
router.post('/:id/void', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserStripeConfig(userId);

    if (!user?.stripe_secret_key) {
      return res.status(400).json({
        error: 'Set Stripe API Keys to use this feature',
      });
    }

    const stripe = createUserStripeClient(user.stripe_secret_key);
    if (!stripe) {
      return res.status(400).json({ error: 'Invalid Stripe configuration' });
    }

    const invoice = await stripe.invoices.voidInvoice(req.params.id);
    res.json({ invoice, message: 'Invoice voided successfully' });
  } catch (error) {
    console.error('Error voiding invoice:', error);
    res.status(500).json({ error: 'Failed to void invoice' });
  }
});

module.exports = router;
