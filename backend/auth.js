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
  recordUserLogin,
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

    // Record login activity and update status
    recordUserLogin(user.id, (err) => {
      if (err) {
        console.error('Failed to record login activity:', err);
        // Don't fail the login, just log the error
      }
    });

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

// Admin endpoint to check user activity status
router.get('/admin/user-activity', (req, res) => {
  try {
    const { getDb } = require('./db');
    const db = getDb();

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Get comprehensive user activity data
    db.all(
      `
      SELECT 
        id,
        username,
        email,
        status,
        invited_by,
        subscription_tier,
        subscription_status,
        subscription_start_date,
        subscription_end_date
      FROM users 
      WHERE id > 1
      ORDER BY id DESC
      LIMIT 50
    `,
      [],
      (err, users) => {
        if (err) {
          console.error('Error fetching user activity:', err);
          return res.status(500).json({ error: 'Failed to fetch user data' });
        }

        // Calculate summary statistics
        const summary = {
          totalUsers: users.length,
          activeUsers: users.filter((u) => u.status === 'active').length,
          pendingUsers: users.filter((u) => u.status === 'pending').length,
          invitedUsers: users.filter((u) => u.status === 'invited').length,
          suspendedUsers: users.filter((u) => u.status === 'suspended').length,
          paidSubscriptions: users.filter((u) => u.subscription_tier && u.subscription_tier !== 'free').length,
        };

        // Group users by status for easier analysis
        const usersByStatus = {
          active: users.filter((u) => u.status === 'active'),
          pending: users.filter((u) => u.status === 'pending'),
          invited: users.filter((u) => u.status === 'invited'),
          suspended: users.filter((u) => u.status === 'suspended' || u.status === null),
        };

        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          summary,
          usersByStatus,
          allUsers: users,
        });
      },
    );
  } catch (error) {
    console.error('Error in user activity endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quick user statistics endpoint (lightweight)
router.get('/admin/user-stats', (req, res) => {
  try {
    const { getDb } = require('./db');
    const db = getDb();

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    db.get(
      `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users,
        SUM(CASE WHEN status = 'invited' THEN 1 ELSE 0 END) as invited_users,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_users,
        SUM(CASE WHEN subscription_tier = 'platinum' THEN 1 ELSE 0 END) as platinum_users,
        SUM(CASE WHEN subscription_tier = 'operandi' THEN 1 ELSE 0 END) as operandi_users
      FROM users 
      WHERE id > 1
    `,
      [],
      (err, stats) => {
        if (err) {
          console.error('Error fetching user stats:', err);
          return res.status(500).json({ error: 'Failed to fetch statistics' });
        }

        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          stats: stats || {},
        });
      },
    );
  } catch (error) {
    console.error('Error in user stats endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to update user password (CLI management)
router.post('/admin/update-password', (req, res) => {
  const { username, password, temporary } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Missing required fields: username and password are required',
    });
  }

  // Validate password strength
  function validatePassword(pwd) {
    const errors = [];

    if (pwd.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate the password
  const validation = validatePassword(password);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Password validation failed',
      details: validation.errors,
    });
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

    // Hash the password and update in database
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('Password hashing error:', hashErr);
        return res.status(500).json({ error: 'Failed to process password' });
      }

      // Update password in database
      const { getDb } = require('./db');
      const db = getDb();

      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const isTemporary = temporary === true || temporary === 'true' || temporary === 1;

      db.run(
        'UPDATE users SET hashed_password = ?, temporary_password = ? WHERE id = ?',
        [hashedPassword, isTemporary ? 1 : 0, user.id],
        function (updateErr) {
          if (updateErr) {
            console.error('Error updating password:', updateErr);
            return res.status(500).json({ error: 'Failed to update password' });
          }

          res.json({
            message: `Successfully updated password for "${username}"`,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
            },
            temporary: isTemporary,
            rowsChanged: this.changes,
          });
        },
      );
    });
  });
});

module.exports = router;
