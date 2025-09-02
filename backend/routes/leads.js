// Leads CRUD routes with authentication
const express = require('express');
const router = express.Router();
const { getUserLeads, createUserLead, updateUserLead, deleteUserLead } = require('../db');

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

// Validation middleware for leads
function validateLead(req, res, next) {
  const { title, status } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const validStatuses = [
    'Monitoring',
    'Contacted',
    'Negotiating',
    'Offer Rejected',
    'Follow Up',
    'Offer Accepted',
    'Deal Finalized',
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  // Validate reminder date format if provided
  if (req.body.reminder_date && !/^\d{4}-\d{2}-\d{2}$/.test(req.body.reminder_date)) {
    return res.status(400).json({ error: 'Reminder date must be in YYYY-MM-DD format' });
  }

  next();
}

// GET /api/leads - Get all leads for authenticated user
router.get('/', authenticateJWT, (req, res) => {
  const { page = 1, limit = 50, status, contact_id, has_reminder, overdue } = req.query;

  getUserLeads(req.user.id, (err, leads) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch leads' });
    }

    let filteredLeads = leads;

    // Filter by status if specified
    if (status) {
      filteredLeads = filteredLeads.filter((l) => l.status === status);
    }

    // Filter by contact if specified
    if (contact_id) {
      filteredLeads = filteredLeads.filter((l) => l.contact_id == contact_id);
    }

    // Filter leads with reminders
    if (has_reminder === 'true') {
      filteredLeads = filteredLeads.filter((l) => l.reminder_date);
    } else if (has_reminder === 'false') {
      filteredLeads = filteredLeads.filter((l) => !l.reminder_date);
    }

    // Filter overdue reminders
    if (overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      filteredLeads = filteredLeads.filter((l) => l.reminder_date && l.reminder_date < today);
    }

    // Sort by creation date (newest first) by default
    filteredLeads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

    res.json({
      leads: paginatedLeads,
      pagination: {
        total: filteredLeads.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredLeads.length / limit),
      },
    });
  });
});

// GET /api/leads/stats - Get lead statistics
router.get('/stats', authenticateJWT, (req, res) => {
  getUserLeads(req.user.id, (err, leads) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch lead stats' });
    }

    const today = new Date().toISOString().split('T')[0];

    const stats = {
      total: leads.length,
      by_status: {},
      overdue_reminders: leads.filter((l) => l.reminder_date && l.reminder_date < today).length,
      today_reminders: leads.filter((l) => l.reminder_date === today).length,
      upcoming_reminders: leads.filter((l) => l.reminder_date && l.reminder_date > today).length,
    };

    // Count by status
    leads.forEach((lead) => {
      stats.by_status[lead.status] = (stats.by_status[lead.status] || 0) + 1;
    });

    res.json(stats);
  });
});

// GET /api/leads/:id - Get specific lead
router.get('/:id', authenticateJWT, (req, res) => {
  getUserLeads(req.user.id, (err, leads) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch lead' });
    }

    const lead = leads.find((l) => l.id == req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  });
});

// POST /api/leads - Create new lead
router.post('/', authenticateJWT, validateLead, (req, res) => {
  createUserLead(req.user.id, req.body, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to create lead' });
    }

    const newLead = { id: this.lastID, ...req.body };
    res.status(201).json(newLead);
  });
});

// PUT /api/leads/:id - Update lead
router.put('/:id', authenticateJWT, validateLead, (req, res) => {
  updateUserLead(req.user.id, req.params.id, req.body, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update lead' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ id: req.params.id, ...req.body });
  });
});

// PATCH /api/leads/:id/status - Update lead status only
router.patch('/:id/status', authenticateJWT, (req, res) => {
  const { status } = req.body;

  const validStatuses = [
    'Monitoring',
    'Contacted',
    'Negotiating',
    'Offer Rejected',
    'Follow Up',
    'Offer Accepted',
    'Deal Finalized',
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  // Get current lead first
  getUserLeads(req.user.id, (err, leads) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch lead' });
    }

    const currentLead = leads.find((l) => l.id == req.params.id);
    if (!currentLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updateData = { ...currentLead, status };

    updateUserLead(req.user.id, req.params.id, updateData, function (err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update lead status' });
      }

      res.json({ id: req.params.id, status });
    });
  });
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', authenticateJWT, (req, res) => {
  deleteUserLead(req.user.id, req.params.id, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to delete lead' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  });
});

module.exports = router;
