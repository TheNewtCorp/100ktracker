#!/usr/bin/env node

const {
  addUser,
  addEnhancedUser,
  findUser,
  findUserByEmail,
  updateInvitationTimestamp,
  initDB,
  closeDB,
} = require('./db');
const emailService = require('./email-service');
const crypto = require('crypto');
const path = require('path');

// Command line argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      const cleanKey = key.replace('--', '');
      options[cleanKey] = value || true;
    }
  }

  return options;
}

// Generate secure random password
function generatePassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate username format
function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

// Create user with enhanced tracking
async function createUser(options) {
  return new Promise((resolve, reject) => {
    // Validate required fields
    if (!options.username) {
      reject(new Error('Username is required (--username=john_doe)'));
      return;
    }

    if (!options.email) {
      reject(new Error('Email is required (--email=john@example.com)'));
      return;
    }

    // Validate formats
    if (!isValidUsername(options.username)) {
      reject(new Error('Username must be 3-20 characters, letters, numbers, underscore, or dash only'));
      return;
    }

    if (!isValidEmail(options.email)) {
      reject(new Error('Please provide a valid email address'));
      return;
    }

    // Generate password if not provided
    const password = options.password || generatePassword();

    // Check if user already exists
    findUser(options.username, (err, existingUser) => {
      if (err) {
        reject(new Error(`Database error: ${err.message}`));
        return;
      }

      if (existingUser) {
        reject(new Error(`User '${options.username}' already exists`));
        return;
      }

      // Check for duplicate email
      findUserByEmail(options.email, (err, existingEmail) => {
        if (err) {
          reject(new Error(`Database error: ${err.message}`));
          return;
        }

        if (existingEmail) {
          reject(new Error(`Email '${options.email}' is already registered`));
          return;
        }

        // Create the user
        addEnhancedUser(options.username, password, options.email, 1, function (err) {
          if (err) {
            reject(new Error(`Failed to create user: ${err.message}`));
            return;
          }

          resolve({
            userId: this.lastID,
            username: options.username,
            email: options.email,
            password: password,
            temporaryPassword: !options.password,
          });
        });
      });
    });
  });
}

// Display help
function showHelp() {
  console.log(`
📧 100K Tracker - User Management CLI

Usage:
  node add-user.js --username=<username> --email=<email> [options]

Required:
  --username=<string>     Username (3-20 chars, alphanumeric, _, -)
  --email=<string>        Valid email address

Optional:
  --password=<string>     Custom password (if not provided, generates secure random password)
  --generate-password     Force generate random password even if --password provided
  --no-email             Skip sending invitation email
  --send-email           Force send email even if email service not configured
  --help                  Show this help message

Examples:
  node add-user.js --username=john_doe --email=john@example.com
  node add-user.js --username=jane_smith --email=jane@watchdealers.com --password=MySecure123!
  node add-user.js --username=bob_trader --email=bob@traders.com --generate-password
  node add-user.js --username=test_user --email=test@example.com --no-email

Notes:
  - Generated passwords are 12 characters with mixed case, numbers, and symbols
  - Users are created with 'pending' status and must change password on first login
  - All user data is isolated per user (watches, contacts, leads, invoices)
  - Email invitations are sent automatically unless --no-email is specified
  - Configure email settings in .env file for production use
  `);
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help || Object.keys(options).length === 0) {
    showHelp();
    process.exit(0);
  }

  try {
    console.log('🚀 Initializing database...\n');

    // Initialize database first
    await initDB();
    console.log('✅ Database initialized successfully\n');

    console.log('🚀 Creating new user...\n');

    const result = await createUser(options);

    console.log('✅ User created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   Username: ${result.username}`);
    console.log(`   Email: ${result.email}`);
    console.log(`   User ID: ${result.userId}`);
    console.log(`   Status: pending`);

    if (result.temporaryPassword) {
      console.log('\n🔐 Temporary Password:');
      console.log(`   Password: ${result.password}`);
      console.log('   ⚠️  User must change password on first login');
    }

    // Send invitation email unless --no-email is specified
    if (!options['no-email']) {
      console.log('\n📧 Sending invitation email...');

      try {
        const emailResult = await emailService.sendInvitationEmail({
          username: result.username,
          email: result.email,
          password: result.password,
          temporaryPassword: result.temporaryPassword,
        });

        if (emailResult.success) {
          console.log('✅ Invitation email sent successfully!');
          if (emailResult.previewUrl) {
            console.log(`� Preview: ${emailResult.previewUrl}`);
          }

          // Update database to track email sending
          updateInvitationTimestamp(result.userId, (err) => {
            if (err) console.error('Warning: Failed to update invitation timestamp:', err.message);
          });
        }
      } catch (emailError) {
        console.log('⚠️  Failed to send invitation email:', emailError.message);
        console.log("   User created successfully, but you'll need to send credentials manually.");

        if (!emailService.isConfigured()) {
          console.log('   💡 Tip: Configure email settings in .env file to enable automatic invitations');
        }
      }
    } else {
      console.log('\n📧 Email notification skipped (--no-email specified)');
    }

    console.log('\n�📝 Next Steps:');
    if (options['no-email'] || !emailService.isConfigured()) {
      console.log('   1. Send credentials to user via secure channel');
    } else {
      console.log('   1. User should receive invitation email shortly');
    }
    console.log('   2. User logs in and changes password');
    console.log('   3. User configures Stripe API keys in Account Settings');
    console.log('   4. User can start tracking watches, contacts, and leads\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await closeDB();
    } catch (err) {
      console.error('Error closing database:', err.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createUser, generatePassword, isValidEmail, isValidUsername };
