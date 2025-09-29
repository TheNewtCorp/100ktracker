// Shared authentication middleware for all routes
const jwt = require('jsonwebtoken');
const { isPromoAdmin } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Special authentication middleware for promo admin routes
function authenticatePromoAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Check if the user is the promo admin
    isPromoAdmin(user.username, (adminErr, isAdmin) => {
      if (adminErr) {
        console.error('Error checking promo admin status:', adminErr);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!isAdmin) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'This endpoint requires promo admin privileges',
        });
      }

      req.user = user;
      next();
    });
  });
}

// Validation helper functions
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function validatePositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}

module.exports = {
  authenticateJWT,
  authenticatePromoAdmin,
  validateEmail,
  validateDate,
  validatePositiveNumber,
};
