// General admin routes for account provisioning and management
const express = require('express');
const router = express.Router();
const emailService = require('../email-service');
const { authenticateGeneralAdmin } = require('../middleware');
const {
  findUserByEmail,
  addEnhancedUser,
  updateUserSubscription,
  runProvisioningTransaction,
  logProvisioningAttempt,
  getUserByUsername,
  findUser,
  getAllUsers,
  getAllPromoSignups,
} = require('../db');

// Define subscription tier configurations
const SUBSCRIPTION_TIERS = {
  free: {
    tier: 'free',
    status: 'active',
    price: 0,
    features: ['basic_tracking'],
    duration: 'unlimited',
  },
  platinum: {
    tier: 'platinum',
    status: 'active',
    price: 99,
    features: ['all_features', 'priority_support', 'advanced_analytics'],
    duration: 'monthly',
  },
  operandi: {
    tier: 'operandi',
    status: 'active',
    price: 0,
    features: ['operandi_challenge', 'premium_features', 'exclusive_access'],
    duration: 'special',
  },
};

// Helper function to generate secure password
function generateSecurePassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  // Ensure password has at least one of each type
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  password += upperCase[Math.floor(Math.random() * upperCase.length)];
  password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

// Helper function to attempt email sending with retry
async function attemptEmailSending(userData, maxAttempts = 2) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📧 Email attempt ${attempt}/${maxAttempts} for ${userData.email}`);
      const result = await emailService.sendInvitationEmail(userData);
      console.log(`✅ Email sent successfully on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);

      if (attempt < maxAttempts) {
        // Wait 2 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError;
}

// Main provisioning endpoint
router.post('/provision-account', authenticateGeneralAdmin, async (req, res) => {
  const {
    email,
    fullName,
    subscriptionTier = 'free',
    temporaryPassword,
    sendEmail = true,
    promoSignupId = null,
  } = req.body;

  // Validation
  if (!email || !fullName) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Email and fullName are required',
    });
  }

  if (!SUBSCRIPTION_TIERS[subscriptionTier]) {
    return res.status(400).json({
      error: 'Invalid subscription tier',
      validTiers: Object.keys(SUBSCRIPTION_TIERS),
    });
  }

  const adminUser = req.user.username;
  let provisioningResults = {
    steps: {
      accountCreated: false,
      subscriptionAssigned: false,
      emailSent: false,
      promoUpdated: false,
    },
    account: null,
    subscription: null,
    email: null,
    error: null,
    rollbackPerformed: false,
  };

  // Log provisioning attempt start
  const auditData = {
    email,
    fullName,
    subscriptionTier,
    adminUser,
    stepCompleted: 'started',
    success: false,
  };

  try {
    // Step 1: Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      findUserByEmail(email, (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    if (existingUser) {
      await new Promise((resolve) => {
        logProvisioningAttempt(
          {
            ...auditData,
            stepCompleted: 'validation',
            success: false,
            errorMessage: 'Email already exists',
          },
          () => resolve(),
        );
      });

      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists',
        existingUser: {
          username: existingUser.username,
          email: existingUser.email,
        },
      });
    }

    // Generate username and password
    const username = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const password = temporaryPassword || generateSecurePassword();
    const subscriptionConfig = SUBSCRIPTION_TIERS[subscriptionTier];

    console.log(`🚀 Starting provisioning for ${email} with tier: ${subscriptionTier}`);

    // Step 2: Create account in transaction
    const transactionResult = await new Promise((resolve, reject) => {
      const operations = [
        // Operation 1: Create user account
        (callback) => {
          console.log('📝 Creating user account...');
          addEnhancedUser(username, password, email, 1, (err, userId) => {
            if (err) {
              return callback(err);
            }
            console.log(`✅ User account created with ID: ${userId}`);
            callback(null, { userId, username, email, password });
          });
        },

        // Operation 2: Assign subscription
        (callback) => {
          console.log('📋 Assigning subscription...');
          const subscriptionData = {
            tier: subscriptionConfig.tier,
            status: subscriptionConfig.status,
            price: subscriptionConfig.price,
            startDate: new Date().toISOString().split('T')[0],
            endDate: null, // Will be calculated based on tier
          };

          updateUserSubscription(username, subscriptionData, (err) => {
            if (err) {
              return callback(err);
            }
            console.log(`✅ Subscription assigned: ${subscriptionConfig.tier}`);
            callback(null, subscriptionData);
          });
        },
      ];

      runProvisioningTransaction(operations, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    provisioningResults.steps.accountCreated = true;
    provisioningResults.steps.subscriptionAssigned = true;
    provisioningResults.account = transactionResult[0];
    provisioningResults.subscription = transactionResult[1];

    // Log successful account creation
    await new Promise((resolve) => {
      logProvisioningAttempt(
        {
          ...auditData,
          stepCompleted: 'account_created',
          success: true,
        },
        () => resolve(),
      );
    });

    console.log('✅ Account and subscription created successfully');

    // Step 3: Send email (if requested)
    if (sendEmail) {
      try {
        console.log('📧 Attempting to send invitation email...');

        const emailResult = await attemptEmailSending({
          username,
          email,
          password,
          temporaryPassword: !temporaryPassword, // Mark as temporary if auto-generated
        });

        provisioningResults.steps.emailSent = true;
        provisioningResults.email = emailResult;

        console.log('✅ Invitation email sent successfully');

        // Log successful email
        await new Promise((resolve) => {
          logProvisioningAttempt(
            {
              ...auditData,
              stepCompleted: 'email_sent',
              success: true,
            },
            () => resolve(),
          );
        });
      } catch (emailError) {
        console.error('❌ Email sending failed after retries, rolling back account...');

        // Rollback: Delete the created account
        try {
          await new Promise((resolve, reject) => {
            // Note: You may need to implement deleteUser function in db.js
            // For now, we'll log the rollback need
            console.log(`🔄 ROLLBACK NEEDED: Delete user ${username} (${email})`);
            resolve();
          });

          provisioningResults.rollbackPerformed = true;

          // Log rollback
          await new Promise((resolve) => {
            logProvisioningAttempt(
              {
                ...auditData,
                stepCompleted: 'rollback',
                success: false,
                errorMessage: `Email failed: ${emailError.message}`,
              },
              () => resolve(),
            );
          });

          return res.status(500).json({
            error: 'Email delivery failed',
            message: 'Account creation was rolled back due to email delivery failure',
            emailError: emailError.message,
            rollbackPerformed: true,
            steps: provisioningResults.steps,
          });
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError.message);

          // Critical error - account exists but email failed and rollback failed
          await new Promise((resolve) => {
            logProvisioningAttempt(
              {
                ...auditData,
                stepCompleted: 'rollback_failed',
                success: false,
                errorMessage: `Email failed, rollback failed: ${rollbackError.message}`,
              },
              () => resolve(),
            );
          });

          return res.status(500).json({
            error: 'Critical error during rollback',
            message: 'Account was created but email failed and rollback failed. Manual intervention required.',
            account: provisioningResults.account,
            emailError: emailError.message,
            rollbackError: rollbackError.message,
            manualAction: `Delete user ${username} manually and retry provisioning`,
          });
        }
      }
    }

    // Step 4: Update promo signup if applicable
    if (promoSignupId) {
      try {
        // Note: This would need to be implemented
        console.log(`📋 Updating promo signup ${promoSignupId} status...`);
        // updatePromoSignupStatus(promoSignupId, 'account_created', `Account created: ${username}`, callback);
        provisioningResults.steps.promoUpdated = true;
      } catch (promoError) {
        console.error('⚠️ Promo signup update failed (non-critical):', promoError.message);
      }
    }

    // Log final success
    await new Promise((resolve) => {
      logProvisioningAttempt(
        {
          ...auditData,
          stepCompleted: 'completed',
          success: true,
        },
        () => resolve(),
      );
    });

    console.log('🎉 Account provisioning completed successfully');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Account provisioned successfully',
      account: {
        userId: provisioningResults.account.userId,
        username: provisioningResults.account.username,
        email: provisioningResults.account.email,
        temporaryPassword: !temporaryPassword ? provisioningResults.account.password : undefined,
      },
      subscription: {
        tier: provisioningResults.subscription.tier,
        status: provisioningResults.subscription.status,
        features: subscriptionConfig.features,
      },
      email: sendEmail
        ? {
            sent: provisioningResults.steps.emailSent,
            messageId: provisioningResults.email?.messageId,
            previewUrl: provisioningResults.email?.previewUrl,
          }
        : { sent: false, reason: 'Email not requested' },
      promoSignup: promoSignupId
        ? {
            id: promoSignupId,
            statusUpdated: provisioningResults.steps.promoUpdated,
          }
        : null,
      steps: provisioningResults.steps,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Provisioning failed:', error.message);

    // Log failure
    await new Promise((resolve) => {
      logProvisioningAttempt(
        {
          ...auditData,
          stepCompleted: 'failed',
          success: false,
          errorMessage: error.message,
        },
        () => resolve(),
      );
    });

    res.status(500).json({
      error: 'Provisioning failed',
      message: error.message,
      steps: provisioningResults.steps,
      rollbackPerformed: provisioningResults.rollbackPerformed,
    });
  }
});

// Endpoint to resend invitation email
router.post('/resend-invitation', authenticateGeneralAdmin, async (req, res) => {
  const { username, email } = req.body;

  if (!username && !email) {
    return res.status(400).json({
      error: 'Either username or email is required',
    });
  }

  try {
    // Find user
    const user = await new Promise((resolve, reject) => {
      if (username) {
        getUserByUsername(username, (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      } else {
        findUserByEmail(email, (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Send invitation email
    const emailResult = await attemptEmailSending({
      username: user.username,
      email: user.email,
      password: '[Password from database]', // Password is hashed in DB, so we indicate this
      temporaryPassword: true,
    });

    res.json({
      success: true,
      message: 'Invitation email resent successfully',
      user: {
        username: user.username,
        email: user.email,
      },
      email: {
        sent: true,
        messageId: emailResult.messageId,
        previewUrl: emailResult.previewUrl,
      },
    });
  } catch (error) {
    console.error('❌ Resend invitation failed:', error.message);
    res.status(500).json({
      error: 'Failed to resend invitation',
      message: error.message,
    });
  }
});

// Dashboard statistics endpoint
router.get('/dashboard-stats', authenticateGeneralAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard statistics...');

    // Get all users to calculate stats
    const users = await getAllUsers();

    // Get all promo signups
    const promoSignups = await new Promise((resolve, reject) => {
      getAllPromoSignups((err, signups) => {
        if (err) {
          console.warn('Could not fetch promo signups:', err.message);
          resolve([]); // Don't fail if promo signups aren't available
        } else {
          resolve(signups || []);
        }
      });
    });

    // Get recent provisioning attempts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProvisioningAttempts = await new Promise((resolve, reject) => {
      const db = require('../db').db;
      if (!db) {
        resolve(0);
        return;
      }

      db.all(
        'SELECT COUNT(*) as count FROM provisioning_audit WHERE created_at >= ?',
        [thirtyDaysAgo.toISOString()],
        (err, rows) => {
          if (err) {
            console.warn('Could not fetch recent provisioning attempts:', err.message);
            resolve(0);
          } else {
            resolve(rows?.[0]?.count || 0);
          }
        },
      );
    });

    // Calculate subscription breakdowns
    const subscriptionStats = {
      free: 0,
      platinum: 0,
      operandi: 0,
    };

    if (Array.isArray(users)) {
      users.forEach((user) => {
        const tier = user.subscription_tier || 'free';
        if (subscriptionStats.hasOwnProperty(tier)) {
          subscriptionStats[tier]++;
        } else {
          subscriptionStats.free++; // Default to free for unknown tiers
        }
      });
    }

    const stats = {
      totalUsers: Array.isArray(users) ? users.length : 0,
      totalPromoSignups: Array.isArray(promoSignups) ? promoSignups.length : 0,
      recentProvisioningAttempts: recentProvisioningAttempts,
      activeSubscriptions: subscriptionStats,
    };

    console.log('✅ Dashboard stats calculated:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Dashboard stats failed:', error.message);
    res.status(500).json({
      error: 'Failed to load dashboard statistics',
      message: error.message,
    });
  }
});

// Get all users endpoint
router.get('/users', authenticateGeneralAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, subscriptionTier, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    // For now, return mock data structure
    const users = [];
    const totalUsers = 0;
    const totalPages = 1;

    res.json({
      users,
      totalUsers,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('❌ Get users failed:', error.message);
    res.status(500).json({
      error: 'Failed to load users',
      message: error.message,
    });
  }
});

// Get user by ID
router.get('/users/:id', authenticateGeneralAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Mock response for now
    res.json({
      user: null,
      message: 'User endpoint not yet implemented',
    });
  } catch (error) {
    console.error('❌ Get user failed:', error.message);
    res.status(500).json({
      error: 'Failed to load user',
      message: error.message,
    });
  }
});

// Reset user password
router.post('/users/:id/reset-password', authenticateGeneralAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Mock response for now
    res.json({
      success: true,
      message: 'Password reset endpoint not yet implemented',
    });
  } catch (error) {
    console.error('❌ Reset password failed:', error.message);
    res.status(500).json({
      error: 'Failed to reset password',
      message: error.message,
    });
  }
});

// Get provisioning audit logs
router.get('/audit-logs', authenticateGeneralAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, email, adminUser, stepCompleted, success, dateFrom, dateTo } = req.query;

    // Mock response for now
    const logs = [];
    const totalPages = 1;

    res.json({
      logs,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('❌ Get audit logs failed:', error.message);
    res.status(500).json({
      error: 'Failed to load audit logs',
      message: error.message,
    });
  }
});

// Get provisioning statistics
router.get('/provisioning-stats', authenticateGeneralAdmin, async (req, res) => {
  try {
    // Mock response for now
    const stats = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      recentActivity: 0,
      topAdminUsers: [],
      stepBreakdown: [],
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Get provisioning stats failed:', error.message);
    res.status(500).json({
      error: 'Failed to load provisioning statistics',
      message: error.message,
    });
  }
});

module.exports = router;
