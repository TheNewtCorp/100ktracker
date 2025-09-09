const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authenticateJWT } = require('../middleware');

// Get user account information
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, created_at, status, temporary_password, first_login_at FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        },
      );
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email || '',
      createdAt: user.created_at,
      status: user.status,
      temporaryPassword: !!user.temporary_password,
      firstLogin: !user.first_login_at,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET email = ? WHERE id = ?', [email || null, userId], function (err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current password hash
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT hashed_password FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashed_password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear temporary password flag
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET hashed_password = ?, temporary_password = 0 WHERE id = ?',
        [hashedNewPassword, userId],
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get Stripe configuration
router.get('/stripe', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await new Promise((resolve, reject) => {
      db.get('SELECT stripe_secret_key, stripe_publishable_key FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const hasStripeConfig = !!(user?.stripe_secret_key && user?.stripe_publishable_key);

    res.json({
      hasStripeConfig,
      publishableKey: user?.stripe_publishable_key || '',
      // Never send the secret key to the frontend
      secretKeyConfigured: !!user?.stripe_secret_key,
    });
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    res.status(500).json({ error: 'Failed to fetch Stripe configuration' });
  }
});

// Update Stripe configuration
router.put('/stripe', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { secretKey, publishableKey } = req.body;

    if (!secretKey || !publishableKey) {
      return res.status(400).json({ error: 'Both secret key and publishable key are required' });
    }

    // Basic validation for Stripe key formats
    if (!secretKey.startsWith('sk_')) {
      return res.status(400).json({ error: 'Invalid secret key format' });
    }

    if (!publishableKey.startsWith('pk_')) {
      return res.status(400).json({ error: 'Invalid publishable key format' });
    }

    // TODO: In production, encrypt the secret key before storing
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET stripe_secret_key = ?, stripe_publishable_key = ? WHERE id = ?',
        [secretKey, publishableKey, userId],
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    res.json({ message: 'Stripe configuration updated successfully' });
  } catch (error) {
    console.error('Error updating Stripe config:', error);
    res.status(500).json({ error: 'Failed to update Stripe configuration' });
  }
});

// Clear Stripe configuration
router.delete('/stripe', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET stripe_secret_key = NULL, stripe_publishable_key = NULL WHERE id = ?',
        [userId],
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    res.json({ message: 'Stripe configuration cleared successfully' });
  } catch (error) {
    console.error('Error clearing Stripe config:', error);
    res.status(500).json({ error: 'Failed to clear Stripe configuration' });
  }
});

module.exports = router;
