const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { stripe, STRIPE_CONFIG } = require('../stripe-config');
const { authenticateJWT } = require('../middleware');

// Helper function to create or get Stripe customer
async function createOrGetStripeCustomer(contactId, userId) {
  try {
    // Get contact from database
    const contact = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_contacts WHERE id = ? AND user_id = ?', [contactId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // If already has Stripe customer ID, return customer
    if (contact.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(contact.stripe_customer_id);
        return customer;
      } catch (error) {
        // If customer doesn't exist in Stripe, create new one
        console.log('Stripe customer not found, creating new one');
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: contact.email,
      name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
      phone: contact.phone || undefined,
      metadata: {
        contact_id: contactId.toString(),
        user_id: userId.toString(),
        source: '100ktracker',
      },
    });

    // Update contact with Stripe customer ID
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE user_contacts SET stripe_customer_id = ? WHERE id = ? AND user_id = ?',
        [customer.id, contactId, userId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        },
      );
    });

    return customer;
  } catch (error) {
    console.error('Error creating/getting Stripe customer:', error);
    throw error;
  }
}

// Create invoice
router.post('/create', authenticateJWT, async (req, res) => {
  try {
    const { contactId, watches, notes, dueDate, taxRate = 0 } = req.body;
    const userId = req.user.id;

    if (!contactId || !watches || watches.length === 0) {
      return res.status(400).json({ error: 'Contact ID and watches are required' });
    }

    // Create or get Stripe customer
    const customer = await createOrGetStripeCustomer(contactId, userId);

    // Get watch details from database
    const watchIds = watches.map((w) => w.watchId);
    const placeholders = watchIds.map(() => '?').join(',');

    const watchDetails = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM user_watches WHERE id IN (${placeholders}) AND user_id = ?`,
        [...watchIds, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });

    // Create Stripe invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      currency: STRIPE_CONFIG.currency,
      description: notes || 'Watch Purchase Invoice',
      due_date: dueDate ? Math.floor(new Date(dueDate).getTime() / 1000) : undefined,
      metadata: {
        contact_id: contactId.toString(),
        user_id: userId.toString(),
        source: '100ktracker',
      },
    });

    // Add invoice items (watches)
    const invoiceItems = [];
    for (const watchRequest of watches) {
      const watchDetail = watchDetails.find((w) => w.id === watchRequest.watchId);
      if (!watchDetail) {
        continue;
      }

      const price = watchRequest.price || watchDetail.purchase_price || 0;
      const quantity = watchRequest.quantity || 1;

      const invoiceItem = await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: Math.round(price * 100), // Convert to cents
        currency: STRIPE_CONFIG.currency,
        quantity: quantity,
        description: `${watchDetail.brand} ${watchDetail.model} - ${watchDetail.reference_number}`,
        metadata: {
          watch_id: watchDetail.id.toString(),
          reference_number: watchDetail.reference_number,
          serial_number: watchDetail.serial_number || '',
        },
      });

      invoiceItems.push({
        watch_id: watchDetail.id,
        description: invoiceItem.description,
        quantity: quantity,
        unit_price: price,
        total_amount: price * quantity,
      });
    }

    // Add tax if specified
    if (taxRate > 0) {
      const subtotal = watches.reduce((sum, w) => {
        const watchDetail = watchDetails.find((wd) => wd.id === w.watchId);
        const price = w.price || watchDetail?.purchase_price || 0;
        const quantity = w.quantity || 1;
        return sum + price * quantity;
      }, 0);

      const taxAmount = subtotal * (taxRate / 100);

      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: Math.round(taxAmount * 100),
        currency: STRIPE_CONFIG.currency,
        description: `Tax (${taxRate}%)`,
        metadata: {
          type: 'tax',
        },
      });
    }

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Store invoice in database
    const invoiceId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO user_invoices (
          user_id, stripe_invoice_id, contact_id, status, total_amount, 
          currency, due_date, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          userId,
          finalizedInvoice.id,
          contactId,
          finalizedInvoice.status,
          finalizedInvoice.total / 100, // Convert from cents
          finalizedInvoice.currency,
          dueDate || null,
          notes || null,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        },
      );
    });

    // Store invoice items
    for (const item of invoiceItems) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO user_invoice_items (
            user_id, invoice_id, watch_id, description, quantity, unit_price, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, invoiceId, item.watch_id, item.description, item.quantity, item.unit_price, item.total_amount],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          },
        );
      });
    }

    res.json({
      success: true,
      invoice: {
        id: finalizedInvoice.id,
        status: finalizedInvoice.status,
        total: finalizedInvoice.total / 100,
        currency: finalizedInvoice.currency,
        invoice_pdf: finalizedInvoice.invoice_pdf,
        hosted_invoice_url: finalizedInvoice.hosted_invoice_url,
        due_date: finalizedInvoice.due_date,
      },
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice: ' + error.message });
  }
});

// Get all invoices
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT i.*, TRIM(c.first_name || ' ' || COALESCE(c.last_name, '')) as contact_name, c.email as contact_email
      FROM user_invoices i
      LEFT JOIN user_contacts c ON i.contact_id = c.id
      WHERE i.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const invoices = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Get invoice from database
    const invoice = await new Promise((resolve, reject) => {
      db.get(
        `SELECT i.*, TRIM(c.first_name || ' ' || COALESCE(c.last_name, '')) as contact_name, c.email as contact_email
         FROM user_invoices i
         LEFT JOIN user_contacts c ON i.contact_id = c.id
         WHERE i.id = ? AND i.user_id = ?`,
        [invoiceId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        },
      );
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get invoice items
    const items = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM user_invoice_items WHERE invoice_id = ? AND user_id = ?',
        [invoiceId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });

    // Get latest status from Stripe
    if (invoice.stripe_invoice_id) {
      try {
        const stripeInvoice = await stripe.invoices.retrieve(invoice.stripe_invoice_id);

        // Update status if changed
        if (stripeInvoice.status !== invoice.status) {
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE user_invoices SET status = ? WHERE id = ? AND user_id = ?',
              [stripeInvoice.status, invoiceId, userId],
              function (err) {
                if (err) reject(err);
                else resolve(this.changes);
              },
            );
          });
          invoice.status = stripeInvoice.status;
        }

        invoice.stripe_details = {
          hosted_invoice_url: stripeInvoice.hosted_invoice_url,
          invoice_pdf: stripeInvoice.invoice_pdf,
          payment_intent: stripeInvoice.payment_intent,
        };
      } catch (error) {
        console.error('Error fetching Stripe invoice:', error);
      }
    }

    res.json({ invoice, items });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Send invoice to customer
router.post('/:id/send', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Get invoice from database
    const invoice = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_invoices WHERE id = ? AND user_id = ?', [invoiceId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const sentInvoice = await stripe.invoices.sendInvoice(invoice.stripe_invoice_id);

    // Update status in database
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE user_invoices SET status = ? WHERE id = ? AND user_id = ?',
        [sentInvoice.status, invoiceId, userId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        },
      );
    });

    res.json({
      success: true,
      invoice: {
        id: sentInvoice.id,
        status: sentInvoice.status,
        hosted_invoice_url: sentInvoice.hosted_invoice_url,
      },
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ error: 'Failed to send invoice: ' + error.message });
  }
});

// Cancel/void invoice
router.post('/:id/void', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Get invoice from database
    const invoice = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_invoices WHERE id = ? AND user_id = ?', [invoiceId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const voidedInvoice = await stripe.invoices.voidInvoice(invoice.stripe_invoice_id);

    // Update status in database
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE user_invoices SET status = ? WHERE id = ? AND user_id = ?',
        [voidedInvoice.status, invoiceId, userId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        },
      );
    });

    res.json({
      success: true,
      invoice: {
        id: voidedInvoice.id,
        status: voidedInvoice.status,
      },
    });
  } catch (error) {
    console.error('Error voiding invoice:', error);
    res.status(500).json({ error: 'Failed to void invoice: ' + error.message });
  }
});

// Get Stripe publishable key
router.get('/config/public-key', (req, res) => {
  res.json({
    publishableKey: STRIPE_CONFIG.publishableKey,
  });
});

module.exports = router;
