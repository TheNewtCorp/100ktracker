#!/usr/bin/env node

const { db } = require('./db');

// List all users with their details
function listUsers() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.status,
        u.temporary_password,
        u.created_at,
        u.invitation_sent_at,
        u.first_login_at,
        invited.username as invited_by_username
      FROM users u
      LEFT JOIN users invited ON u.invited_by = invited.id
      ORDER BY u.created_at DESC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
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

// Display users in a nice table format
function displayUsers(users) {
  console.log('\n👥 100K Tracker Users\n');

  if (users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log('ID | Status | Username       | Email                    | Created        | First Login    | Invited By');
  console.log(
    '---|--------|----------------|--------------------------|----------------|----------------|------------',
  );

  users.forEach((user) => {
    const id = user.id.toString().padEnd(2);
    const status = `${getStatusIndicator(user.status)} ${user.status}`.padEnd(6);
    const username = user.username.padEnd(14);
    const email = (user.email || '').padEnd(24);
    const created = formatDate(user.created_at).padEnd(14);
    const firstLogin = formatDate(user.first_login_at).padEnd(14);
    const invitedBy = user.invited_by_username || 'System';

    console.log(`${id} | ${status} | ${username} | ${email} | ${created} | ${firstLogin} | ${invitedBy}`);
  });

  // Summary stats
  const statusCounts = users.reduce((acc, user) => {
    acc[user.status] = (acc[user.status] || 0) + 1;
    return acc;
  }, {});

  const tempPasswordUsers = users.filter((u) => u.temporary_password).length;

  console.log('\n📊 Summary:');
  console.log(`   Total Users: ${users.length}`);
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${getStatusIndicator(status)} ${status}: ${count}`);
  });
  if (tempPasswordUsers > 0) {
    console.log(`   🔐 Users with temporary passwords: ${tempPasswordUsers}`);
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
👥 100K Tracker - User List CLI

Usage:
  node list-users.js [options]

Options:
  --status=<status>       Filter by status (active, pending, suspended)
  --help                  Show this help message

Examples:
  node list-users.js                    # List all users
  node list-users.js --status=pending   # List only pending users
  
Status Indicators:
  ✅ active    - User has logged in and is active
  ⏳ pending   - User created but hasn't logged in yet
  🚫 suspended - User account suspended
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
    const users = await listUsers();

    // Filter by status if specified
    let filteredUsers = users;
    if (options.status) {
      filteredUsers = users.filter((user) => user.status === options.status);
      console.log(`\nFiltering by status: ${options.status}`);
    }

    displayUsers(filteredUsers);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      }
    });
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { listUsers, displayUsers };
