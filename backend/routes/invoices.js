const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, getDb, initDB } = require('../db');
const { authenticateJWT } = require('../middleware');
const { client, SQUARE_CONFIG, paymentsApi, customersApi, ordersApi } = require('../square-config');
const crypto = require('crypto');

const router = express.Router();

// Generate UUID v4 using crypto module (Node.js built-in)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

// Helper function to map status between frontend enum and database values
function mapStatusToDb(frontendStatus) {
  const statusMap = {
    Created: 'draft',
    Sent: 'open',
    Fulfilled: 'paid',
    Overdue: 'overdue',
    Cancelled: 'void',
  };
  return statusMap[frontendStatus] || frontendStatus.toLowerCase();
}

function mapStatusFromDb(dbStatus) {
  const statusMap = {
    draft: 'Created',
    open: 'Sent',
    paid: 'Fulfilled',
    overdue: 'Overdue',
    void: 'Cancelled',
  };
  return statusMap[dbStatus] || dbStatus;
}

// Test endpoint to verify routes are working
router.get('/test', authenticateJWT, (req, res) => {
  res.json({
    message: 'Enhanced invoice routes are working',
    userId: req.user.id,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get all invoices for authenticated user
 * GET /api/invoices
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get invoices from local database with contact information
    const invoices = await dbAll(
      `
      SELECT 
        i.*,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        c.email as contact_email,
        c.phone as contact_phone,
        c.company as contact_company
      FROM user_invoices i
      LEFT JOIN user_contacts c ON i.contact_id = c.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `,
      [userId],
    );

    // Format invoices for frontend with new status system
    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      invoice_number: `INV-${String(invoice.id).padStart(6, '0')}`,
      status: mapStatusFromDb(invoice.status),
      total_amount: invoice.total_amount,
      currency: invoice.currency || 'USD',
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      due_date: invoice.due_date,
      notes: invoice.notes,
      // Contact information
      contact_id: invoice.contact_id,
      contact_name:
        invoice.contact_first_name && invoice.contact_last_name
          ? `${invoice.contact_first_name} ${invoice.contact_last_name}`
          : null,
      contact_email: invoice.contact_email,
      contact_phone: invoice.contact_phone,
      // Customer info for new system
      customer_info: {
        name:
          invoice.contact_first_name && invoice.contact_last_name
            ? `${invoice.contact_first_name} ${invoice.contact_last_name}`
            : 'Manual Customer',
        email: invoice.contact_email,
        phone: invoice.contact_phone,
        company: invoice.contact_company,
      },
      // Payment processing info
      payment_processor: invoice.payment_processor || 'square',
      square_invoice_id: invoice.square_invoice_id,
      stripe_invoice_id: invoice.stripe_invoice_id, // Legacy support
      payment_id: invoice.payment_id,
      payment_status: invoice.payment_status,
    }));

    res.json({
      invoices: formattedInvoices,
      total: formattedInvoices.length,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      message: error.message,
    });
  }
});

/**
 * Get specific invoice with items
 * GET /api/invoices/:id
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Get invoice with contact information
    const invoice = await dbGet(
      `
      SELECT 
        i.*,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        c.email as contact_email,
        c.phone as contact_phone,
        c.company as contact_company
      FROM user_invoices i
      LEFT JOIN user_contacts c ON i.contact_id = c.id
      WHERE i.id = ? AND i.user_id = ?
    `,
      [invoiceId, userId],
    );

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get invoice items
    const items = await dbAll(
      `
      SELECT 
        ii.*,
        w.brand as watch_brand,
        w.model as watch_model,
        w.reference as watch_reference
      FROM user_invoice_items ii
      LEFT JOIN user_watches w ON ii.watch_id = w.id
      WHERE ii.invoice_id = ? AND ii.user_id = ?
      ORDER BY ii.id
    `,
      [invoiceId, userId],
    );

    // Format invoice for frontend
    const formattedInvoice = {
      id: invoice.id,
      invoice_number: `INV-${String(invoice.id).padStart(6, '0')}`,
      status: mapStatusFromDb(invoice.status),
      total_amount: invoice.total_amount,
      currency: invoice.currency || 'USD',
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      due_date: invoice.due_date,
      notes: invoice.notes,
      // Contact information
      contact_id: invoice.contact_id,
      contact_name:
        invoice.contact_first_name && invoice.contact_last_name
          ? `${invoice.contact_first_name} ${invoice.contact_last_name}`
          : null,
      contact_email: invoice.contact_email,
      contact_phone: invoice.contact_phone,
      // Customer info for new system
      customer_info: {
        name:
          invoice.contact_first_name && invoice.contact_last_name
            ? `${invoice.contact_first_name} ${invoice.contact_last_name}`
            : 'Manual Customer',
        email: invoice.contact_email,
        phone: invoice.contact_phone,
        company: invoice.contact_company,
      },
      // Payment processing info
      payment_processor: invoice.payment_processor || 'square',
      square_invoice_id: invoice.square_invoice_id,
      stripe_invoice_id: invoice.stripe_invoice_id, // Legacy support
      payment_id: invoice.payment_id,
      payment_status: invoice.payment_status,
      // Items
      items: items.map((item) => ({
        id: item.id,
        watch_id: item.watch_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount,
        watch_info: item.watch_id
          ? {
              brand: item.watch_brand,
              model: item.watch_model,
              reference: item.watch_reference,
            }
          : null,
      })),
    };

    res.json({
      invoice: formattedInvoice,
      items: formattedInvoice.items,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice',
      message: error.message,
    });
  }
});

/**
 * Create new invoice
 * POST /api/invoices
 */
router.post(
  '/',
  [
    body('customer_info').isObject().withMessage('Customer information is required'),
    body('customer_info.name').notEmpty().withMessage('Customer name is required'),
    body('customer_info.email').isEmail().withMessage('Valid customer email is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.description').notEmpty().withMessage('Item description is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be a positive integer'),
    body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Item price must be a positive number'),
    body('due_date').optional().isISO8601().withMessage('Due date must be a valid date'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  authenticateJWT,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const userId = req.user.id;
      const { customer_info, items, due_date, notes, contact_id } = req.body;

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

      // Create invoice record
      const invoiceResult = await dbRun(
        `
      INSERT INTO user_invoices (
        user_id, contact_id, status, total_amount, currency, 
        due_date, notes, payment_processor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          userId,
          contact_id || null,
          'draft', // Start in Created status (mapped to draft in DB)
          totalAmount,
          'USD',
          due_date || null,
          notes || '',
          'square',
        ],
      );

      const invoiceId = invoiceResult.lastID;

      // Create invoice items
      for (const item of items) {
        await dbRun(
          `
        INSERT INTO user_invoice_items (
          user_id, invoice_id, watch_id, description, quantity, unit_price, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
          [
            userId,
            invoiceId,
            item.watch_id || null,
            item.description,
            item.quantity,
            item.unit_price,
            item.unit_price * item.quantity,
          ],
        );
      }

      // Get the created invoice with items
      const invoice = await dbGet('SELECT * FROM user_invoices WHERE id = ? AND user_id = ?', [invoiceId, userId]);

      const invoiceItems = await dbAll('SELECT * FROM user_invoice_items WHERE invoice_id = ? AND user_id = ?', [
        invoiceId,
        userId,
      ]);

      // Format response
      const formattedInvoice = {
        id: invoice.id,
        invoice_number: `INV-${String(invoice.id).padStart(6, '0')}`,
        status: mapStatusFromDb(invoice.status),
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        due_date: invoice.due_date,
        notes: invoice.notes,
        customer_info: customer_info,
        items: invoiceItems.map((item) => ({
          id: item.id,
          watch_id: item.watch_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
        })),
      };

      res.status(201).json({
        invoice: formattedInvoice,
        message: 'Invoice created successfully',
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(500).json({
        error: 'Failed to create invoice',
        message: error.message,
      });
    }
  },
);

/**
 * Update invoice status
 * PUT /api/invoices/:id/status
 */
router.put(
  '/:id/status',
  [
    body('status')
      .isIn(['Created', 'Sent', 'Fulfilled', 'Overdue', 'Cancelled'])
      .withMessage('Invalid status. Must be one of: Created, Sent, Fulfilled, Overdue, Cancelled'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  authenticateJWT,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const userId = req.user.id;
      const invoiceId = req.params.id;
      const { status, notes } = req.body;

      // Check if invoice exists and belongs to user
      const invoice = await dbGet('SELECT * FROM user_invoices WHERE id = ? AND user_id = ?', [invoiceId, userId]);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Map frontend status to database status
      const dbStatus = mapStatusToDb(status);

      // Update invoice status
      const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const updateValues = [dbStatus];

      // Add notes update if provided
      if (notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(notes);
      }

      updateValues.push(invoiceId);

      await dbRun(`UPDATE user_invoices SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

      // Get updated invoice
      const updatedInvoice = await dbGet('SELECT * FROM user_invoices WHERE id = ? AND user_id = ?', [
        invoiceId,
        userId,
      ]);

      res.json({
        invoice: {
          id: updatedInvoice.id,
          status: mapStatusFromDb(updatedInvoice.status),
          updated_at: updatedInvoice.updated_at,
          notes: updatedInvoice.notes,
        },
        message: `Invoice status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      res.status(500).json({
        error: 'Failed to update invoice status',
        message: error.message,
      });
    }
  },
);

/**
 * Record Square payment for invoice
 * POST /api/invoices/:id/payment
 */
router.post(
  '/:id/payment',
  [
    body('payment_id').notEmpty().withMessage('Payment ID is required'),
    body('status')
      .optional()
      .isIn(['Created', 'Sent', 'Fulfilled', 'Overdue', 'Cancelled'])
      .withMessage('Invalid status'),
  ],
  authenticateJWT,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const userId = req.user.id;
      const invoiceId = req.params.id;
      const { payment_id, status = 'Fulfilled' } = req.body;

      // Check if invoice exists and belongs to user
      const invoice = await dbGet('SELECT * FROM user_invoices WHERE id = ? AND user_id = ?', [invoiceId, userId]);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Update invoice with payment information
      const dbStatus = mapStatusToDb(status);

      await dbRun(
        `
      UPDATE user_invoices 
      SET payment_id = ?, payment_status = 'completed', status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
        [payment_id, dbStatus, invoiceId],
      );

      // Get updated invoice
      const updatedInvoice = await dbGet('SELECT * FROM user_invoices WHERE id = ? AND user_id = ?', [
        invoiceId,
        userId,
      ]);

      res.json({
        invoice: {
          id: updatedInvoice.id,
          status: mapStatusFromDb(updatedInvoice.status),
          payment_id: updatedInvoice.payment_id,
          payment_status: updatedInvoice.payment_status,
          updated_at: updatedInvoice.updated_at,
        },
        message: 'Payment recorded successfully',
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({
        error: 'Failed to record payment',
        message: error.message,
      });
    }
  },
);

/**
 * Process Square charge for invoice
 * POST /api/invoices/:id/charge
 */
router.post(
  '/:id/charge',
  [
    body('payment_token').notEmpty().withMessage('Payment token is required'),
    body('customer_info').isObject().withMessage('Customer information is required'),
    body('customer_info.name').notEmpty().withMessage('Customer name is required'),
    body('customer_info.email').isEmail().withMessage('Customer email is required'),
    body('idempotency_key').notEmpty().withMessage('Idempotency key is required'),
  ],
  authenticateJWT,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const userId = req.user.id;
      const invoiceId = req.params.id;
      const { payment_token, customer_info, idempotency_key } = req.body;

      // Get invoice
      const invoice = await dbGet('SELECT * FROM user_invoices WHERE id = ? AND user_id = ?', [invoiceId, userId]);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Prevent charging already paid invoices
      if (invoice.status === 'paid') {
        return res.status(400).json({ error: 'Invoice is already paid' });
      }

      try {
        // Create or find Square customer
        let customerId;

        // Search for existing customer by email
        const searchResult = await customersApi.search({
          filter: {
            emailAddress: {
              exact: customer_info.email,
            },
          },
        });

        if (searchResult.customers && searchResult.customers.length > 0) {
          customerId = searchResult.customers[0].id;
        } else {
          // Create new customer
          const createResult = await customersApi.create({
            givenName: customer_info.name.split(' ')[0] || customer_info.name,
            familyName: customer_info.name.split(' ').slice(1).join(' ') || '',
            emailAddress: customer_info.email,
            phoneNumber: customer_info.phone || undefined,
          });
          customerId = createResult.customer.id;
        }

        // Process payment
        const paymentRequest = {
          idempotencyKey: idempotency_key,
          sourceId: payment_token,
          amountMoney: {
            amount: BigInt(Math.round(invoice.total_amount * 100)), // Convert to cents
            currency: 'USD',
          },
          autocomplete: true,
          locationId: process.env.SQUARE_LOCATION_ID,
          note: `Payment for Invoice INV-${String(invoice.id).padStart(6, '0')}`,
          buyerEmailAddress: customer_info.email,
        };

        const paymentResult = await paymentsApi.create(paymentRequest);

        if (paymentResult.payment && paymentResult.payment.status === 'COMPLETED') {
          // Update invoice with successful payment
          await dbRun(
            `
          UPDATE user_invoices 
          SET payment_id = ?, payment_status = 'completed', status = 'paid', 
              square_customer_id = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `,
            [paymentResult.payment.id, customerId, invoiceId],
          );

          res.json({
            success: true,
            payment_id: paymentResult.payment.id,
            message: 'Payment processed successfully',
            payment: {
              id: paymentResult.payment.id,
              status: paymentResult.payment.status,
              amount: Number(paymentResult.payment.amountMoney.amount) / 100,
              currency: paymentResult.payment.amountMoney.currency,
            },
          });
        } else {
          throw new Error('Payment not completed');
        }
      } catch (squareError) {
        console.error('Square payment error:', squareError);

        // Handle specific Square errors
        if (squareError.statusCode && squareError.body && squareError.body.errors) {
          const error = squareError.body.errors[0];
          return res.status(400).json({
            success: false,
            error: 'Payment failed',
            message: error.detail || 'Payment processing failed',
            code: error.code,
          });
        }

        res.status(500).json({
          success: false,
          error: 'Payment processing failed',
          message: squareError.message,
        });
      }
    } catch (error) {
      console.error('Error processing invoice charge:', error);
      res.status(500).json({
        error: 'Failed to process payment',
        message: error.message,
      });
    }
  },
);

/**
 * Delete invoice (soft delete - mark as cancelled)
 * DELETE /api/invoices/:id
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceId = req.params.id;

    // Check if invoice exists and belongs to user
    const invoice = await dbGet('SELECT * FROM user_invoices WHERE id = ? AND user_id = ?', [invoiceId, userId]);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Prevent deleting paid invoices
    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Cannot delete paid invoices' });
    }

    // Soft delete by marking as cancelled
    await dbRun('UPDATE user_invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      'void',
      invoiceId,
    ]);

    res.json({
      message: 'Invoice cancelled successfully',
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      error: 'Failed to delete invoice',
      message: error.message,
    });
  }
});

module.exports = router;
