// Promo signup routes for Operandi Challenge
const express = require('express');
const router = express.Router();
const emailService = require('../email-service');
const { authenticatePromoAdmin } = require('../middleware');
const {
  createPromoSignup,
  getAllPromoSignups,
  getPromoSignupById,
  updatePromoSignupStatus,
  getPromoSignupsByStatus,
  findUserByEmail,
  addEnhancedUser,
} = require('../db');

// Validation helper functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function validateSignupData(data) {
  const errors = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email address is required');
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  if (!data.businessName || data.businessName.trim().length < 2) {
    errors.push('Business name must be at least 2 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Rate limiting helper (simple in-memory store)
const signupAttempts = new Map();

function checkRateLimit(email, ip) {
  const key = `${email}_${ip}`;
  const now = Date.now();
  const attempts = signupAttempts.get(key) || [];

  // Clean old attempts (older than 1 hour)
  const recentAttempts = attempts.filter((time) => now - time < 60 * 60 * 1000);

  if (recentAttempts.length >= 3) {
    return false; // Too many attempts
  }

  recentAttempts.push(now);
  signupAttempts.set(key, recentAttempts);
  return true;
}

// Public endpoint: Submit Operandi Challenge signup
router.post('/operandi-challenge', (req, res) => {
  const { fullName, email, phone, businessName, referralSource, experienceLevel, interests, comments } = req.body;

  // Basic rate limiting
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(email, clientIp)) {
    return res.status(429).json({
      error: 'Too many signup attempts. Please try again later.',
      retryAfter: 3600, // 1 hour
    });
  }

  // Validate input data
  const validation = validateSignupData({ fullName, email, phone, businessName });
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors,
    });
  }

  // Check if email already exists in promo signups
  getPromoSignupsByStatus('pending', (err, existingSignups) => {
    if (err) {
      console.error('Error checking existing signups:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const emailExists = existingSignups.some((signup) => signup.email.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      return res.status(409).json({
        error: 'Email already registered for this promotion',
        message:
          'You have already signed up for the Operandi Challenge. We will review your application and contact you soon.',
      });
    }

    // Check if email already exists as a user account
    findUserByEmail(email, (userErr, existingUser) => {
      if (userErr) {
        console.error('Error checking existing users:', userErr);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (existingUser) {
        return res.status(409).json({
          error: 'Email already has an account',
          message: 'This email already has a 100ktracker account. Please contact support if you need assistance.',
        });
      }

      // Create the promo signup
      const signupData = {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        businessName: businessName.trim(),
        referralSource: referralSource ? referralSource.trim() : null,
        experienceLevel: experienceLevel ? experienceLevel.trim() : null,
        interests: interests ? interests.trim() : null,
        comments: comments ? comments.trim() : null,
      };

      createPromoSignup(signupData, (createErr, result) => {
        if (createErr) {
          console.error('Error creating promo signup:', createErr);

          if (createErr.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({
              error: 'Email already registered',
              message: 'This email is already registered for the promotion.',
            });
          }

          return res.status(500).json({ error: 'Failed to process signup' });
        }

        console.log(`New Operandi Challenge signup: ${email} (ID: ${result.id})`);

        res.status(201).json({
          success: true,
          message:
            'Thank you for signing up for the Operandi Challenge! We will review your application and contact you within 1-2 business days.',
          signupId: result.id,
          timestamp: new Date().toISOString(),
        });

        // Send notification email to admin
        emailService
          .sendPromoSignupNotification(signupData, '100kprofittracker@gmail.com')
          .then(() => {
            console.log('✅ Admin notification email sent for signup:', result.id);
          })
          .catch((emailErr) => {
            console.error('❌ Failed to send admin notification email:', emailErr.message);
            // Don't fail the request, signup was successful
          });
      });
    });
  });
});

// Admin endpoint: Get all promo signups
router.get('/admin/signups', authenticatePromoAdmin, (req, res) => {
  const { status } = req.query;

  if (status) {
    getPromoSignupsByStatus(status, (err, signups) => {
      if (err) {
        console.error('Error fetching promo signups by status:', err);
        return res.status(500).json({ error: 'Failed to fetch signups' });
      }

      res.json({
        success: true,
        filter: { status },
        count: signups.length,
        signups,
      });
    });
  } else {
    getAllPromoSignups((err, signups) => {
      if (err) {
        console.error('Error fetching all promo signups:', err);
        return res.status(500).json({ error: 'Failed to fetch signups' });
      }

      // Calculate summary stats
      const summary = {
        total: signups.length,
        pending: signups.filter((s) => s.status === 'pending').length,
        approved: signups.filter((s) => s.status === 'approved').length,
        rejected: signups.filter((s) => s.status === 'rejected').length,
      };

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        summary,
        signups,
      });
    });
  }
});

// Admin endpoint: Get specific promo signup
router.get('/admin/signups/:id', authenticatePromoAdmin, (req, res) => {
  const { id } = req.params;

  getPromoSignupById(id, (err, signup) => {
    if (err) {
      console.error('Error fetching promo signup:', err);
      return res.status(500).json({ error: 'Failed to fetch signup' });
    }

    if (!signup) {
      return res.status(404).json({ error: 'Signup not found' });
    }

    res.json({
      success: true,
      signup,
    });
  });
});

// Admin endpoint: Update promo signup status
router.put('/admin/signups/:id', authenticatePromoAdmin, (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      error: 'Invalid status. Must be: pending, approved, or rejected',
    });
  }

  // Get the signup first to have the data for response
  getPromoSignupById(id, (getErr, signup) => {
    if (getErr) {
      console.error('Error fetching signup for update:', getErr);
      return res.status(500).json({ error: 'Failed to fetch signup' });
    }

    if (!signup) {
      return res.status(404).json({ error: 'Signup not found' });
    }

    updatePromoSignupStatus(id, status, adminNotes || null, (updateErr) => {
      if (updateErr) {
        console.error('Error updating promo signup status:', updateErr);
        return res.status(500).json({ error: 'Failed to update signup status' });
      }

      console.log(`Promo signup ${id} status updated to: ${status}`);

      res.json({
        success: true,
        message: `Signup status updated to ${status}`,
        signup: {
          ...signup,
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        },
      });

      // TODO: Send notification email if approved
    });
  });
});

// Admin endpoint: Approve signup and create user account
router.post('/admin/signups/:id/create-account', authenticatePromoAdmin, (req, res) => {
  const { id } = req.params;
  const { temporaryPassword } = req.body;

  getPromoSignupById(id, (getErr, signup) => {
    if (getErr) {
      console.error('Error fetching signup for account creation:', getErr);
      return res.status(500).json({ error: 'Failed to fetch signup' });
    }

    if (!signup) {
      return res.status(404).json({ error: 'Signup not found' });
    }

    if (signup.status !== 'pending') {
      return res.status(400).json({
        error: 'Can only create accounts for pending signups',
        currentStatus: signup.status,
      });
    }

    // Generate username from email (before @ symbol)
    const username = signup.email.split('@')[0].toLowerCase();

    // Generate a secure temporary password if not provided
    const password = temporaryPassword || generateSecurePassword();

    // Create the user account
    addEnhancedUser(username, password, signup.email, 1, (userErr, userId) => {
      if (userErr) {
        console.error('Error creating user account:', userErr);

        if (userErr.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(409).json({
            error: 'Username already exists',
            suggestion: 'Try a different username or contact the user directly',
          });
        }

        return res.status(500).json({ error: 'Failed to create user account' });
      }

      // Update the signup status to approved
      updatePromoSignupStatus(id, 'approved', `Account created - User ID: ${userId}`, (statusErr) => {
        if (statusErr) {
          console.error('Error updating signup status after account creation:', statusErr);
          // Don't fail the request, account was created successfully
        }

        console.log(`Created account for Operandi signup ${id}: ${username} (User ID: ${userId})`);

        res.json({
          success: true,
          message: 'User account created successfully',
          account: {
            userId,
            username,
            email: signup.email,
            temporaryPassword: password,
          },
          signup: {
            id: signup.id,
            status: 'approved',
            fullName: signup.full_name,
            businessName: signup.business_name,
          },
        });

        // TODO: Send welcome email with account details
      });
    });
  });
});

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

module.exports = router;
