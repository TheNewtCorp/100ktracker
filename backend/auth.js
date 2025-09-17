// Express routes for login and registration
const express = require('express');
const router = express.Router();
const {
  addUser,
  findUser,
  verifyPassword,
  updateFirstLoginTimestamp,
  updateUserStatus,
  updateUsername,
  setUserSubscriptionByUsername,
  getSubscriptionTierInfo,
} = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Registration endpoint (temporarily enabled for testing)
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  // Check if user already exists
  findUser(username, (err, existingUser) => {
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    // Create new user
    addUser(username, password, email, (err, userId) => {
      if (err) return res.status(500).json({ error: 'Failed to create user' });
      res.json({ message: 'User created successfully', userId });
    });
  });
});

// Login endpoint with enhanced user management
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  // Use findUser function instead of accessing db directly
  findUser(username, (err, user) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact administrator.' });
    }

    if (!verifyPassword(user, password)) return res.status(401).json({ error: 'Invalid credentials' });

    // Update first login timestamp if this is their first login
    if (!user.first_login_at) {
      updateFirstLoginTimestamp(user.id, (err) => {
        if (err) console.error('Failed to update first login timestamp:', err);
      });
    }

    // Update status from pending to active on first successful login
    if (user.status === 'pending') {
      updateUserStatus(user.id, 'active', (err) => {
        if (err) console.error('Failed to update user status:', err);
      });
    }

    // Issue JWT with additional user info
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        status: user.status === 'pending' ? 'active' : user.status, // Use updated status
      },
      JWT_SECRET,
      { expiresIn: '1d' },
    );

    res.json({
      token,
      temporaryPassword: !!user.temporary_password,
      firstLogin: !user.first_login_at,
      status: user.status === 'pending' ? 'active' : user.status,
    });
  });
});

// Middleware to verify JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Protected route to get user info
router.get('/me', authenticateJWT, (req, res) => {
  findUser(req.user.username, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, email: user.email, created_at: user.created_at });
  });
});

// Admin endpoint to update username (should be protected with admin auth in production)
router.put('/admin/update-username', (req, res) => {
  const { oldUsername, newUsername } = req.body;

  if (!oldUsername || !newUsername) {
    return res.status(400).json({ error: 'Missing oldUsername or newUsername' });
  }

  // Check if old user exists
  findUser(oldUsername, (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: `User "${oldUsername}" not found` });
    }

    // Check if new username already exists
    findUser(newUsername, (err, existingUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: `Username "${newUsername}" already exists` });
      }

      // Update the username
      updateUsername(oldUsername, newUsername, (err) => {
        if (err) {
          console.error('Error updating username:', err);
          return res.status(500).json({ error: 'Failed to update username' });
        }

        res.json({
          message: `Successfully updated username from "${oldUsername}" to "${newUsername}"`,
          userId: user.id,
          email: user.email,
        });
      });
    });
  });
});

// Admin endpoint to set user subscription (CLI management)
router.post('/admin/set-subscription', (req, res) => {
  const { username, tier, status, price, startDate, endDate, stripeSubscriptionId } = req.body;

  if (!username || !tier || !status) {
    return res.status(400).json({
      error: 'Missing required fields: username, tier, and status are required',
    });
  }

  // Validate tier
  const validTiers = ['platinum', 'operandi', 'free'];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({
      error: `Invalid tier "${tier}". Valid tiers are: ${validTiers.join(', ')}`,
    });
  }

  // Validate status
  const validStatuses = ['active', 'past_due', 'canceled', 'free'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Invalid status "${status}". Valid statuses are: ${validStatuses.join(', ')}`,
    });
  }

  // Validate dates if provided
  if (startDate && isNaN(new Date(startDate).getTime())) {
    return res.status(400).json({ error: 'Invalid start date format. Use YYYY-MM-DD' });
  }

  if (endDate && isNaN(new Date(endDate).getTime())) {
    return res.status(400).json({ error: 'Invalid end date format. Use YYYY-MM-DD' });
  }

  // Check if user exists
  findUser(username, (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: `User "${username}" not found` });
    }

    // Get tier info for price if not provided
    const tierInfo = getSubscriptionTierInfo(tier);
    const effectivePrice = price !== undefined ? price : tierInfo.price;

    const subscriptionData = {
      tier,
      status,
      price: effectivePrice,
      startDate: startDate || null,
      endDate: endDate || null,
      stripeSubscriptionId: stripeSubscriptionId || null,
    };

    // Update subscription
    setUserSubscriptionByUsername(username, subscriptionData, (err) => {
      if (err) {
        console.error('Error setting subscription:', err);
        return res.status(500).json({ error: 'Failed to set subscription' });
      }

      res.json({
        message: `Successfully set subscription for "${username}"`,
        userId: user.id,
        username: user.username,
        email: user.email,
        subscription: {
          tier,
          tierName: tierInfo.name,
          status,
          price: effectivePrice,
          startDate,
          endDate,
          stripeSubscriptionId,
        },
      });
    });
  });
});

module.exports = router;
