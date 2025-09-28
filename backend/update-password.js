#!/usr/bin/env node

/**
 * Production Password Update Script
 *
 * Updates user passwords via production API, similar to set-subscription command.
 * Works exactly like: curl -X POST "https://one00ktracker.onrender.com/api/admin/update-password"
 */

const https = require('https');

// Production API configuration
const PRODUCTION_URL = 'https://one00ktracker.onrender.com';

/**
 * Make HTTPS request to production API
 */
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(`${PRODUCTION_URL}/api/admin/update-password`, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
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

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
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

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Update password via production API
 */
async function updatePassword(username, password, temporary = false) {
  try {
    const requestData = {
      username,
      password,
      temporary,
    };

    console.log(`Updating password for user: ${username}`);

    const response = await makeRequest(requestData);

    if (response.status === 200) {
      console.log('✅ Password updated successfully');
      if (response.data.message) {
        console.log('Message:', response.data.message);
      }
      return response.data;
    } else {
      throw new Error(
        `Failed to update password. Status: ${response.status}. Response: ${JSON.stringify(response.data)}`,
      );
    }
  } catch (error) {
    throw new Error(`Error updating password: ${error.message}`);
  }
}

// Display help
function showHelp() {
  console.log(`
🔑 100K Tracker - Password Management CLI (Production API)

Usage:
  node update-password.js <username> [password] [--temporary]

Arguments:
  username                Username to update password for

Options:
  --temporary             Mark password as temporary (user must change on login)

Examples:
  🔑 Set specific password:
    node update-password.js john_doe MyNewPass123!
    
  🎲 Generate random password:
    node update-password.js john_doe
    
  ⏳ Set temporary password:
    node update-password.js john_doe --temporary

Password Requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter  
  - At least 1 number
  - At least 1 special character

Notes:
  - 🌐 Makes API calls to production server
  - 🔐 All passwords are securely hashed on the server
  - ⏳ Temporary passwords require user to change on next login
  - 🎲 Generated passwords are 12 characters with mixed case, numbers, and symbols
  `);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(1);
  }

  const username = args[0];
  const isTemporary = args.includes('--temporary');

  // Get password from args or generate one
  let password = args.find((arg) => !arg.startsWith('--') && arg !== username);

  if (!password) {
    password = generatePassword();
    console.log(`Generated password: ${password}`);
  }

  // Validate password
  const validation = validatePassword(password);
  if (!validation.isValid) {
    console.error('❌ Password validation failed:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log(`\n🔐 Updating password for user: ${username}`);
  console.log(`🔒 Temporary password: ${isTemporary ? 'YES' : 'NO'}`);

  try {
    const result = await updatePassword(username, password, isTemporary);

    console.log('\n✅ Password update completed successfully!');
    if (!args.includes(password)) {
      // Only show if generated
      console.log(`� New password: ${password}`);
    }

    if (result && result.user) {
      console.log(`👤 User: ${result.user.username}`);
      console.log(`📧 Email: ${result.user.email || 'None'}`);
    }
  } catch (error) {
    console.error('\n❌ Password update failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updatePassword, generatePassword, validatePassword };
