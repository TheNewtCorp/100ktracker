const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const {
  db,
  getDb,
  ensureDbConnection,
  initDB,
  getUserSubscription,
  updateUserSubscription,
  setUserSubscriptionByUsername,
  getSubscriptionTierInfo,
} = require('../db');
const { authenticateJWT } = require('../middleware');

// Get user account information
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await dbGet(
      'SELECT id, username, email, created_at, status, temporary_password, first_login_at FROM users WHERE id = ?',
      [userId],
    );

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

    await dbRun('UPDATE users SET email = ? WHERE id = ?', [email || null, userId]);

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

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one special character' });
    }

    // Get current password hash
    const user = await dbGet('SELECT hashed_password FROM users WHERE id = ?', [userId]);

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
    await dbRun('UPDATE users SET hashed_password = ?, temporary_password = 0 WHERE id = ?', [
      hashedNewPassword,
      userId,
    ]);

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

    // Initialize database if needed
    let currentDb = getDb();
    if (!currentDb) {
      await initDB();
      currentDb = getDb();
      if (!currentDb) {
        throw new Error('Failed to initialize database');
      }
    }

    const user = await new Promise((resolve, reject) => {
      currentDb.get(
        'SELECT stripe_secret_key, stripe_publishable_key FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        },
      );
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

    // Initialize database if needed
    let currentDb = getDb();
    if (!currentDb) {
      await initDB();
      currentDb = getDb();
      if (!currentDb) {
        throw new Error('Failed to initialize database');
      }
    }

    // TODO: In production, encrypt the secret key before storing
    await new Promise((resolve, reject) => {
      currentDb.run(
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

    // Initialize database if needed
    let currentDb = getDb();
    if (!currentDb) {
      await initDB();
      currentDb = getDb();
      if (!currentDb) {
        throw new Error('Failed to initialize database');
      }
    }

    await new Promise((resolve, reject) => {
      currentDb.run(
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

// ========== SUBSCRIPTION ENDPOINTS ==========

// Get user subscription information
router.get('/subscription', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    getUserSubscription(userId, (err, subscription) => {
      if (err) {
        console.error('Error fetching user subscription:', err);
        return res.status(500).json({ error: 'Failed to fetch subscription information' });
      }

      if (!subscription) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get tier information
      const tier = subscription.subscription_tier || 'free';
      const tierInfo = getSubscriptionTierInfo(tier);

      // Calculate subscription status
      const now = new Date();
      const endDate = subscription.subscription_end_date ? new Date(subscription.subscription_end_date) : null;
      const isExpired = endDate && now > endDate;

      // Determine effective status
      let effectiveStatus = subscription.subscription_status || 'free';
      if (effectiveStatus === 'active' && isExpired) {
        effectiveStatus = 'expired';
      }

      res.json({
        tier: tier,
        tierName: tierInfo.name,
        tierDescription: tierInfo.description,
        price: subscription.subscription_price || tierInfo.price,
        status: effectiveStatus,
        startDate: subscription.subscription_start_date,
        endDate: subscription.subscription_end_date,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        isActive: effectiveStatus === 'active',
        isExpired: isExpired,
        daysRemaining: endDate ? Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))) : null,
      });
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription information' });
  }
});

// Update user subscription (admin only or self-service with validation)
router.put('/subscription', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier, status, price, startDate, endDate, stripeSubscriptionId } = req.body;

    // Validate tier
    const validTiers = ['platinum', 'operandi', 'free'];
    if (tier && !validTiers.includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Validate status
    const validStatuses = ['active', 'past_due', 'canceled', 'free'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid subscription status' });
    }

    // Validate dates
    if (startDate && isNaN(new Date(startDate).getTime())) {
      return res.status(400).json({ error: 'Invalid start date' });
    }

    if (endDate && isNaN(new Date(endDate).getTime())) {
      return res.status(400).json({ error: 'Invalid end date' });
    }

    // Get tier info for price validation
    const tierInfo = getSubscriptionTierInfo(tier);
    const effectivePrice = price !== undefined ? price : tierInfo.price;

    const subscriptionData = {
      tier: tier || null,
      status: status || 'free',
      price: effectivePrice,
      startDate: startDate || null,
      endDate: endDate || null,
      stripeSubscriptionId: stripeSubscriptionId || null,
    };

    updateUserSubscription(userId, subscriptionData, function (err) {
      if (err) {
        console.error('Error updating subscription:', err);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }

      res.json({
        message: 'Subscription updated successfully',
        subscription: {
          tier: subscriptionData.tier,
          tierName: tierInfo.name,
          status: subscriptionData.status,
          price: subscriptionData.price,
          startDate: subscriptionData.startDate,
          endDate: subscriptionData.endDate,
        },
      });
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

module.exports = router;
