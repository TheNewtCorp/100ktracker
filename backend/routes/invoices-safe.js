const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateJWT } = require('../middleware');

// Function to get user's Stripe configuration
async function getUserStripeConfig(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT stripe_secret_key, stripe_publishable_key FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Function to get contact by ID with Stripe information
async function getContactById(userId, contactId) {
  return new Promise((resolve, reject) => {
    db.get(
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

// Get user invoices - now with real Stripe integration when keys are available
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

    const stripe = createUserStripeClient(user.stripe_secret_key);
    if (!stripe) {
      return res.status(400).json({ error: 'Invalid Stripe configuration' });
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({ limit: 100 });

    res.json({
      invoices: invoices.data,
      hasMore: invoices.has_more,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Create invoice - now with real Stripe integration
router.post('/create', authenticateJWT, async (req, res) => {
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

    const { contactId, customer_email, manualCustomer, items, description, metadata } = req.body;

    // Determine customer information and check for existing Stripe customer
    let customerInfo = {};
    let existingStripeCustomerId = null;

    if (contactId) {
      // Use existing contact
      const contact = await getContactById(userId, contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Use existing Stripe customer ID if available
      existingStripeCustomerId = contact.stripe_customer_id;

      customerInfo = {
        email: contact.email,
        name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
        phone: contact.phone || undefined,
        address: contact.street_address
          ? {
              line1: contact.street_address,
              city: contact.city || undefined,
              state: contact.state || undefined,
              postal_code: contact.postal_code || undefined,
              country: 'US',
            }
          : undefined,
      };
    } else if (manualCustomer) {
      // Use manual customer entry
      customerInfo = {
        email: manualCustomer.email,
        name: `${manualCustomer.firstName} ${manualCustomer.lastName}`,
        phone: manualCustomer.phone || undefined,
        address: manualCustomer.address
          ? {
              line1: manualCustomer.address,
              city: manualCustomer.city || undefined,
              state: manualCustomer.state || undefined,
              postal_code: manualCustomer.zipCode || undefined,
              country: manualCustomer.country || 'US',
            }
          : undefined,
      };
    } else if (customer_email) {
      // Fallback to just email
      customerInfo = { email: customer_email };
    } else {
      return res.status(400).json({ error: 'Customer information is required' });
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

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      description: description || 'Invoice',
      auto_advance: false, // Don't auto-finalize
      metadata: {
        user_id: userId.toString(),
        contact_id: contactId?.toString() || '',
        created_via: '100ktracker',
        ...metadata,
      },
    });

    // Add items to invoice
    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: Math.round((item.amount || 0) * 100), // Convert to cents
        currency: 'usd',
        description: item.description || 'Item',
        quantity: item.quantity || 1,
      });
    }

    // Finalize invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    res.json({
      invoice: finalizedInvoice,
      invoice_url: finalizedInvoice.hosted_invoice_url,
      customer: customer,
      message: 'Invoice created successfully',
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
