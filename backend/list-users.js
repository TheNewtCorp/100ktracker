#!/usr/bin/env node

/**
 * Production User List Script
 *
 * Lists users via production API, similar to other admin CLI commands.
 * Works exactly like: curl -X GET "https://one00ktracker.onrender.com/api/admin/list-users"
 */

const https = require('https');

// Production API configuration
const PRODUCTION_URL = 'https://one00ktracker.onrender.com';

/**
 * Make HTTPS request to production API
 */
function makeRequest() {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(`${PRODUCTION_URL}/api/admin/list-users`, options, (res) => {
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
    req.end();
  });
}

/**
 * Fetch users via production API
 */
async function listUsers() {
  try {
    console.log('Fetching users from production API...');

    const response = await makeRequest();

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Failed to fetch users. Status: ${response.status}. Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Get status indicator
function getStatusIndicator(status) {
  switch (status) {
    case 'active':
      return '✅';
    case 'pending':
      return '⏳';
    case 'suspended':
      return '🚫';
    default:
      return '❓';
  }
}

// Display users in a nice table format with passwords
function displayUsers(data, options = {}) {
  console.log('\n👥 100K Tracker Users (Production API)\n');

  const { users, summary } = data;

  if (users.length === 0) {
    console.log('No users found.');
    return;
  }

  // Filter users if status specified
  let filteredUsers = users;
  if (options.status) {
    filteredUsers = users.filter((user) => user.status === options.status);
    console.log(`Filtering by status: ${options.status}\n`);
  }

  if (options.passwords) {
    console.log(
      'ID | Status     | Username         | Email                      | Password Hash                                    | Temp | Subscription',
    );
    console.log(
      '---|------------|------------------|----------------------------|--------------------------------------------------|------|-------------',
    );

    filteredUsers.forEach((user) => {
      const id = user.id.toString().padEnd(2);
      const status = `${getStatusIndicator(user.status)} ${user.status}`.padEnd(9);
      const username = user.username.padEnd(15);
      const email = (user.email || 'None').padEnd(26);
      const passwordHash = user.hashedPassword ? user.hashedPassword.substring(0, 48) + '...' : 'None'.padEnd(48);
      const temp = user.temporaryPassword ? '🔐' : '  ';
      const subscription = user.subscription.tier || 'free';

      console.log(`${id} | ${status} | ${username} | ${email} | ${passwordHash} | ${temp}  | ${subscription}`);
    });
  } else {
    console.log(
      'ID | Status     | Username         | Email                      | Created          | First Login      | Temp | Subscription',
    );
    console.log(
      '---|------------|------------------|----------------------------|------------------|------------------|------|-------------',
    );

    filteredUsers.forEach((user) => {
      const id = user.id.toString().padEnd(2);
      const status = `${getStatusIndicator(user.status)} ${user.status}`.padEnd(9);
      const username = user.username.padEnd(15);
      const email = (user.email || 'None').padEnd(26);
      const created = formatDate(user.createdAt).padEnd(16);
      const firstLogin = formatDate(user.firstLoginAt).padEnd(16);
      const temp = user.temporaryPassword ? '🔐' : '  ';
      const subscription = user.subscription.tier || 'free';

      console.log(
        `${id} | ${status} | ${username} | ${email} | ${created} | ${firstLogin} | ${temp}  | ${subscription}`,
      );
    });
  }

  // Summary stats
  console.log('\n📊 Summary:');
  console.log(`   Total Users: ${summary.totalUsers}`);
  console.log(`   ${getStatusIndicator('active')} Active: ${summary.activeUsers}`);
  console.log(`   ${getStatusIndicator('pending')} Pending: ${summary.pendingUsers}`);
  console.log(`   ${getStatusIndicator('invited')} Invited: ${summary.invitedUsers}`);
  console.log(`   ${getStatusIndicator('suspended')} Suspended: ${summary.suspendedUsers}`);
  console.log(`   🔐 Temporary passwords: ${summary.temporaryPasswordUsers}`);
  console.log(`   💳 Paid subscriptions: ${summary.paidSubscriptions}`);

  if (options.passwords) {
    console.log('\n⚠️  Security Notice: Password hashes are displayed for administrative purposes only.');
    console.log('   Store this information securely and do not share through unsecured channels.');
  }
}

// Parse command line arguments
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

// Show help
function showHelp() {
  console.log(`
👥 100K Tracker - User List CLI (Production API)

Usage:
  node list-users.js [options]

Options:
  --status=<status>       Filter by status (active, pending, invited, suspended)
  --passwords             Show password hashes (SECURITY SENSITIVE)
  --help                  Show this help message

Examples:
  node list-users.js                    # List all users
  node list-users.js --status=active    # List only active users
  node list-users.js --passwords        # Show users with password hashes
  
Status Indicators:
  ✅ active    - User has logged in and is active
  ⏳ pending   - User created but hasn't logged in yet
  📧 invited   - User has been invited but not registered
  🚫 suspended - User account suspended

Notes:
  - 🌐 Makes API calls to production server
  - 🔐 Password hashes are only shown with --passwords flag
  - ⚠️  Password information is security sensitive
  `);
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  try {
    const data = await listUsers();

    displayUsers(data, {
      status: options.status,
      passwords: options.passwords,
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { listUsers, displayUsers };
