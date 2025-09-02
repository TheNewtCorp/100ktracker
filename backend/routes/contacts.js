// Contacts CRUD routes with authentication
const express = require('express');
const router = express.Router();
const {
  getUserContacts,
  createUserContact,
  updateUserContact,
  deleteUserContact,
  getUserCards,
  createUserCard,
  deleteUserCard,
} = require('../db');

// Middleware to verify JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });
  const token = authHeader.split(' ')[1];
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Validation middleware for contacts
function validateContact(req, res, next) {
  const { first_name } = req.body;
  if (!first_name || first_name.trim() === '') {
    return res.status(400).json({ error: 'First name is required' });
  }

  // Validate email format if provided
  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate contact type if provided
  const validTypes = ['Lead', 'Customer', 'Watch Trader', 'Jeweler'];
  if (req.body.contact_type && !validTypes.includes(req.body.contact_type)) {
    return res.status(400).json({ error: 'Invalid contact type' });
  }

  next();
}

// Validation middleware for cards
function validateCard(req, res, next) {
  const { cardholder_name, last4, expiry_month, expiry_year } = req.body;

  if (!cardholder_name || !last4 || !expiry_month || !expiry_year) {
    return res.status(400).json({ error: 'All card fields are required' });
  }

  if (!/^\d{4}$/.test(last4)) {
    return res.status(400).json({ error: 'Last 4 digits must be exactly 4 numbers' });
  }

  if (!/^(0[1-9]|1[0-2])$/.test(expiry_month)) {
    return res.status(400).json({ error: 'Expiry month must be 01-12' });
  }

  const currentYear = new Date().getFullYear();
  const year = parseInt(expiry_year);
  if (year < currentYear || year > currentYear + 20) {
    return res.status(400).json({ error: 'Invalid expiry year' });
  }

  next();
}

// GET /api/contacts - Get all contacts for authenticated user
router.get('/', authenticateJWT, (req, res) => {
  const { page = 1, limit = 50, sort_by = 'first_name', sort_order = 'asc', type, search } = req.query;

  getUserContacts(req.user.id, (err, contacts) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    let filteredContacts = contacts;

    // Filter by contact type if specified
    if (type) {
      filteredContacts = filteredContacts.filter((c) => c.contact_type === type);
    }

    // Search by name, email, or business name
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredContacts = filteredContacts.filter(
        (c) =>
          (c.first_name && c.first_name.toLowerCase().includes(searchTerm)) ||
          (c.last_name && c.last_name.toLowerCase().includes(searchTerm)) ||
          (c.email && c.email.toLowerCase().includes(searchTerm)) ||
          (c.business_name && c.business_name.toLowerCase().includes(searchTerm)),
      );
    }

    // Sort contacts
    filteredContacts.sort((a, b) => {
      const aValue = a[sort_by] || '';
      const bValue = b[sort_by] || '';
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sort_order === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

    res.json({
      contacts: paginatedContacts,
      pagination: {
        total: filteredContacts.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredContacts.length / limit),
      },
    });
  });
});

// GET /api/contacts/:id - Get specific contact
router.get('/:id', authenticateJWT, (req, res) => {
  getUserContacts(req.user.id, (err, contacts) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch contact' });
    }

    const contact = contacts.find((c) => c.id == req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get cards for this contact
    getUserCards(req.user.id, contact.id, (err, cards) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch contact cards' });
      }

      res.json({ ...contact, cards });
    });
  });
});

// POST /api/contacts - Create new contact
router.post('/', authenticateJWT, validateContact, (req, res) => {
  createUserContact(req.user.id, req.body, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to create contact' });
    }

    const newContact = { id: this.lastID, ...req.body };
    res.status(201).json(newContact);
  });
});

// PUT /api/contacts/:id - Update contact
router.put('/:id', authenticateJWT, validateContact, (req, res) => {
  updateUserContact(req.user.id, req.params.id, req.body, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update contact' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ id: req.params.id, ...req.body });
  });
});

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', authenticateJWT, (req, res) => {
  deleteUserContact(req.user.id, req.params.id, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to delete contact' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  });
});

// GET /api/contacts/:id/cards - Get cards for specific contact
router.get('/:id/cards', authenticateJWT, (req, res) => {
  getUserCards(req.user.id, req.params.id, (err, cards) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch cards' });
    }

    res.json(cards);
  });
});

// POST /api/contacts/:id/cards - Add card to contact
router.post('/:id/cards', authenticateJWT, validateCard, (req, res) => {
  const cardData = { ...req.body, contact_id: req.params.id };

  createUserCard(req.user.id, cardData, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to create card' });
    }

    const newCard = { id: this.lastID, ...cardData };
    res.status(201).json(newCard);
  });
});

// DELETE /api/contacts/:contactId/cards/:cardId - Delete card
router.delete('/:contactId/cards/:cardId', authenticateJWT, (req, res) => {
  deleteUserCard(req.user.id, req.params.cardId, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to delete card' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ message: 'Card deleted successfully' });
  });
});

module.exports = router;
