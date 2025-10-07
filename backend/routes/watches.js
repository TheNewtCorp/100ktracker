// Watches CRUD routes with authentication
const express = require('express');
const router = express.Router();
const {
  getUserWatches,
  createUserWatch,
  updateUserWatch,
  deleteUserWatch,
  bulkDeleteUserWatches,
  getWatchHistory,
} = require('../db');

// Middleware to verify JWT (imported from auth.js)
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

// Validation middleware
function validateWatch(req, res, next) {
  const { brand, model, reference_number } = req.body;
  if (!brand || !model || !reference_number) {
    return res.status(400).json({ error: 'Brand, model, and reference number are required' });
  }

  // Validate numeric fields
  const numericFields = [
    'purchase_price',
    'liquidation_price',
    'accessories_cost',
    'price_sold',
    'fees',
    'shipping',
    'taxes',
  ];
  for (const field of numericFields) {
    if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
      const num = parseFloat(req.body[field]);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({ error: `${field} must be a valid positive number` });
      }
      req.body[field] = num;
    }
  }

  // Validate date fields
  const dateFields = ['in_date', 'date_sold'];
  for (const field of dateFields) {
    if (req.body[field] && !/^\d{4}-\d{2}-\d{2}$/.test(req.body[field])) {
      return res.status(400).json({ error: `${field} must be in YYYY-MM-DD format` });
    }
  }

  next();
}

// GET /api/watches - Get all watches for authenticated user
router.get('/', authenticateJWT, (req, res) => {
  const { page = 1, limit = 50, sort_by = 'in_date', sort_order = 'desc', brand, status } = req.query;

  getUserWatches(req.user.id, (err, watches) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch watches' });
    }

    let filteredWatches = watches;

    // Filter by brand if specified
    if (brand) {
      filteredWatches = filteredWatches.filter((w) => w.brand.toLowerCase().includes(brand.toLowerCase()));
    }

    // Filter by status (sold/unsold) if specified
    if (status) {
      if (status === 'sold') {
        filteredWatches = filteredWatches.filter((w) => w.date_sold);
      } else if (status === 'unsold') {
        filteredWatches = filteredWatches.filter((w) => !w.date_sold);
      }
    }

    // Sort watches
    filteredWatches.sort((a, b) => {
      const aValue = a[sort_by] || '';
      const bValue = b[sort_by] || '';
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sort_order === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedWatches = filteredWatches.slice(startIndex, endIndex);

    res.json({
      watches: paginatedWatches,
      pagination: {
        total: filteredWatches.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredWatches.length / limit),
      },
    });
  });
});

// POST /api/watches/bulk-delete - Delete multiple watches (MUST come before /:id route)
router.post('/bulk-delete', authenticateJWT, (req, res) => {
  console.log('Bulk delete endpoint hit with body:', req.body);
  const { watchIds } = req.body;

  if (!watchIds || !Array.isArray(watchIds) || watchIds.length === 0) {
    console.log('Invalid watchIds:', watchIds);
    return res.status(400).json({ error: 'watchIds must be a non-empty array' });
  }

  // Validate that all IDs are valid integers
  const validIds = watchIds.filter((id) => {
    const num = parseInt(id);
    return !isNaN(num) && num > 0;
  });

  if (validIds.length !== watchIds.length) {
    console.log('Invalid IDs found:', watchIds, 'Valid IDs:', validIds);
    return res.status(400).json({ error: 'All watch IDs must be valid positive integers' });
  }

  console.log('Attempting to delete watches for user:', req.user.id, 'IDs:', validIds);

  bulkDeleteUserWatches(req.user.id, validIds, function (err) {
    if (err) {
      console.error('Database error during bulk delete:', err);
      return res.status(500).json({ error: 'Failed to delete watches' });
    }

    const deletedCount = this.changes;
    console.log('Successfully deleted', deletedCount, 'watches');
    res.json({
      message: `Successfully deleted ${deletedCount} watch(es)`,
      deletedCount: deletedCount,
    });
  });
});

// POST /api/watches - Create new watch
router.post('/', authenticateJWT, validateWatch, (req, res) => {
  createUserWatch(req.user.id, req.body, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to create watch' });
    }

    // Return the created watch with the new ID
    const newWatch = { id: this.lastID, ...req.body };
    res.status(201).json(newWatch);
  });
});

// GET /api/watches/:id/history - Get watch change history
router.get('/:id/history', authenticateJWT, (req, res) => {
  const watchId = req.params.id;

  // First verify the watch belongs to the user
  getUserWatches(req.user.id, (err, watches) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to verify watch ownership' });
    }

    const watch = watches.find((w) => w.id.toString() === watchId);
    if (!watch) {
      return res.status(404).json({ error: 'Watch not found' });
    }

    // Get watch history
    getWatchHistory(watchId, (historyErr, history) => {
      if (historyErr) {
        console.error('Database error:', historyErr);
        return res.status(500).json({ error: 'Failed to retrieve watch history' });
      }

      res.json({
        watch: watch,
        history: history || [],
      });
    });
  });
});

// GET /api/watches/:id - Get specific watch
router.get('/:id', authenticateJWT, (req, res) => {
  getUserWatches(req.user.id, (err, watches) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch watch' });
    }

    const watch = watches.find((w) => w.id == req.params.id);
    if (!watch) {
      return res.status(404).json({ error: 'Watch not found' });
    }

    res.json(watch);
  });
});

// PUT /api/watches/:id - Update watch
router.put('/:id', authenticateJWT, validateWatch, (req, res) => {
  updateUserWatch(req.user.id, req.params.id, req.body, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update watch' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Watch not found' });
    }

    res.json({ id: req.params.id, ...req.body });
  });
});

// DELETE /api/watches/:id - Delete watch
router.delete('/:id', authenticateJWT, (req, res) => {
  deleteUserWatch(req.user.id, req.params.id, function (err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to delete watch' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Watch not found' });
    }

    res.json({ message: 'Watch deleted successfully' });
  });
});

module.exports = router;
