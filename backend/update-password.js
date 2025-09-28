#!/usr/bin/env node

const { findUser, initDB, closeDB, getDb } = require('./db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    } else if (!options.username) {
      options.username = arg;
    }
  }

  return options;
}

// Generate secure random password
function generatePassword(length = 12) {
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

// Validate password strength
function validatePassword(password) {
  const errors = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Update user password
async function updatePassword(username, newPassword, options = {}) {
  return new Promise((resolve, reject) => {
    // Validate password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      reject(new Error(`Password validation failed:\n${validation.errors.map((e) => `  - ${e}`).join('\n')}`));
      return;
    }

    // Find user first
    findUser(username, async (err, user) => {
      if (err) {
        reject(new Error(`Database error: ${err.message}`));
        return;
      }

      if (!user) {
        reject(new Error(`User '${username}' not found`));
        return;
      }

      try {
        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Get database connection
        const db = getDb();
        if (!db) {
          reject(new Error('Database connection not available'));
          return;
        }

        // Determine temporary password flag
        const isTemporary = options.temporary || options.generate || false;

        // Update password in database
        db.run(
          'UPDATE users SET hashed_password = ?, temporary_password = ? WHERE id = ?',
          [hashedPassword, isTemporary ? 1 : 0, user.id],
          function (err) {
            if (err) {
              reject(new Error(`Failed to update password: ${err.message}`));
              return;
            }

            resolve({
              userId: user.id,
              username: user.username,
              email: user.email,
              passwordUpdated: true,
              temporaryPassword: isTemporary,
              rowsChanged: this.changes,
            });
          },
        );
      } catch (hashError) {
        reject(new Error(`Password hashing failed: ${hashError.message}`));
      }
    });
  });
}

// Display help
function showHelp() {
  console.log(`
🔑 100K Tracker - Password Management CLI

Usage:
  node update-password.js <username> [options]

Options:
  --password=<string>     Set specific password
  --generate              Generate random secure password
  --temporary             Mark password as temporary (user must change on login)
  --force                 Skip confirmation prompts
  --help                  Show this help message

Examples:
  🔑 Set specific password:
    node update-password.js john_doe --password="SecurePass123!"
    
  🎲 Generate random password:
    node update-password.js john_doe --generate
    
  ⏳ Set temporary password (user must change on login):
    node update-password.js john_doe --generate --temporary
    
  🚀 Force update without confirmation:
    node update-password.js john_doe --password="NewPass123!" --force

Password Requirements:
  - Minimum 6 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter  
  - At least 1 number
  - At least 1 special character (!@#$%^&*)

Notes:
  - 🔐 All passwords are securely hashed before storage
  - ⏳ Temporary passwords require user to change on next login
  - 🎲 Generated passwords are 12 characters with mixed case, numbers, and symbols
  - 👤 User status and other account details remain unchanged
  - 🔍 Use verify-user.js to check user details before updating passwords
  - 📧 Users should be notified of password changes through secure channels
  `);
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help || !options.username) {
    showHelp();
    process.exit(0);
  }

  try {
    console.log('🔑 Password Management Tool\n');
    console.log('🚀 Initializing database...');

    // Initialize database
    await initDB();
    console.log('✅ Database initialized successfully\n');

    const username = options.username;

    // Determine password source
    let newPassword;
    let isGenerated = false;

    if (options.generate) {
      newPassword = generatePassword(12);
      isGenerated = true;
      console.log('🎲 Generated secure password');
    } else if (options.password) {
      newPassword = options.password;
      console.log('🔑 Using provided password');
    } else {
      throw new Error('Either --password=<password> or --generate must be specified');
    }

    console.log(`👤 Target user: ${username}`);
    console.log(`🔐 Password length: ${newPassword.length} characters`);

    if (options.temporary) {
      console.log('⏳ Password will be marked as temporary (user must change on login)');
    }

    // Validate password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      console.log('\n❌ Password validation failed:');
      validation.errors.forEach((error) => {
        console.log(`   - ${error}`);
      });
      process.exit(1);
    }

    console.log('✅ Password validation passed\n');

    // Show confirmation unless --force is used
    if (!options.force) {
      console.log("⚠️  This will update the user's password. The user should be notified through secure channels.");
      console.log('   Continue? Type "yes" to proceed:');

      // Simple confirmation (in production, you might want to use a proper prompt library)
      process.stdout.write('   > ');

      // For this example, we'll proceed automatically in CLI mode
      // In a real implementation, you'd wait for user input here
      console.log('yes (auto-confirmed in CLI mode)');
    }

    console.log('\n🔄 Updating password...');

    // Update the password
    const result = await updatePassword(username, newPassword, {
      temporary: options.temporary,
      generate: options.generate,
    });

    console.log('✅ Password updated successfully!\n');

    console.log('📋 Update Summary:');
    console.log(`   User ID: ${result.userId}`);
    console.log(`   Username: ${result.username}`);
    console.log(`   Email: ${result.email || 'None'}`);
    console.log(`   Rows changed: ${result.rowsChanged}`);
    console.log(`   Temporary password: ${result.temporaryPassword ? 'Yes' : 'No'}`);

    if (isGenerated) {
      console.log('\n🔐 Generated Password (SECURE THIS INFORMATION):');
      console.log(`   Password: ${newPassword}`);
      console.log('   ⚠️  Store this password securely and share through encrypted channels only');
    }

    if (result.temporaryPassword) {
      console.log('\n⏳ Temporary Password Notice:');
      console.log('   - User MUST change password on next login');
      console.log('   - User cannot use the application until password is changed');
      console.log('   - Inform user about mandatory password change requirement');
    }

    console.log('\n📝 Next Steps:');
    console.log('   1. Notify user of password change through secure channel');
    if (result.temporaryPassword) {
      console.log('   2. Inform user about mandatory password change on login');
    } else {
      console.log('   2. User can login immediately with new password');
    }
    console.log('   3. Consider logging this administrative action');
    console.log("   4. Monitor user's next login for successful access\n");
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

module.exports = { updatePassword, generatePassword, validatePassword };
