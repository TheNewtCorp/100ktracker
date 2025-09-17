#!/usr/bin/env node

/**
 * CLI Script to List User Subscriptions
 *
 * This script helps administrators view current subscription status for all users.
 * Useful for auditing and managing subscription states.
 *
 * Usage:
 *   node list-subscriptions.js [options]
 *
 * Options:
 *   --tier <tier>     Filter by subscription tier (platinum, operandi, free)
 *   --status <status> Filter by status (active, past_due, canceled, free)
 *   --expired         Show only expired subscriptions
 *   --active          Show only active subscriptions
 *   --help            Show this help message
 */

const { getAllUsers, getSubscriptionTierInfo, migrateSubscriptionColumns } = require('./db');

/**
 * Display usage instructions
 */
function showUsage() {
  console.log('\n📊 Subscription Status Viewer');
  console.log('=============================\n');
  console.log('Usage: node list-subscriptions.js [options]\n');
  console.log('Options:');
  console.log('  --tier <tier>     Filter by tier (platinum, operandi, free)');
  console.log('  --status <status> Filter by status (active, past_due, canceled, free)');
  console.log('  --expired         Show only expired subscriptions');
  console.log('  --active          Show only active paid subscriptions');
  console.log('  --help            Show this help message\n');
  console.log('Examples:');
  console.log('  node list-subscriptions.js');
  console.log('  node list-subscriptions.js --tier platinum');
  console.log('  node list-subscriptions.js --status active');
  console.log('  node list-subscriptions.js --expired');
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if subscription is expired
 */
function isExpired(endDateString) {
  if (!endDateString) return false;
  return new Date(endDateString) < new Date();
}

/**
 * Get status with expiration check
 */
function getEffectiveStatus(user) {
  if (!user.subscription_status || user.subscription_status === 'free') {
    return 'free';
  }

  if (user.subscription_end_date && isExpired(user.subscription_end_date)) {
    return 'expired';
  }

  return user.subscription_status;
}

/**
 * Filter users based on criteria
 */
function filterUsers(users, filters) {
  return users.filter((user) => {
    // Tier filter
    if (filters.tier) {
      const userTier = user.subscription_tier || 'free';
      if (userTier !== filters.tier) return false;
    }

    // Status filter
    if (filters.status) {
      const effectiveStatus = getEffectiveStatus(user);
      if (effectiveStatus !== filters.status) return false;
    }

    // Expired filter
    if (filters.expired) {
      const effectiveStatus = getEffectiveStatus(user);
      if (effectiveStatus !== 'expired') return false;
    }

    // Active filter
    if (filters.active) {
      const effectiveStatus = getEffectiveStatus(user);
      const tier = user.subscription_tier || 'free';
      if (effectiveStatus !== 'active' || tier === 'free') return false;
    }

    return true;
  });
}

/**
 * Display subscription statistics
 */
function displayStats(users) {
  const stats = {
    total: users.length,
    platinum: 0,
    operandi: 0,
    free: 0,
    active: 0,
    expired: 0,
    totalRevenue: 0,
  };

  users.forEach((user) => {
    const tier = user.subscription_tier || 'free';
    const status = getEffectiveStatus(user);

    stats[tier]++;

    if (status === 'active' && tier !== 'free') {
      stats.active++;
      stats.totalRevenue += user.subscription_price || 0;
    } else if (status === 'expired') {
      stats.expired++;
    }
  });

  console.log('\n📈 Subscription Statistics:');
  console.log('============================');
  console.log(`Total Users: ${stats.total}`);
  console.log(`Platinum Subscribers: ${stats.platinum}`);
  console.log(`Operandi Subscribers: ${stats.operandi}`);
  console.log(`Free Users: ${stats.free}`);
  console.log(`Active Paid Subscriptions: ${stats.active}`);
  console.log(`Expired Subscriptions: ${stats.expired}`);
  console.log(`Monthly Revenue: $${stats.totalRevenue.toFixed(2)}`);
  console.log();
}

/**
 * Display users in table format
 */
function displayUsersTable(users) {
  if (users.length === 0) {
    console.log('📭 No users found matching the criteria.\n');
    return;
  }

  console.log('👥 User Subscriptions:');
  console.log('======================');

  // Header
  const header =
    'Username'.padEnd(20) +
    'Tier'.padEnd(12) +
    'Status'.padEnd(12) +
    'Price'.padEnd(8) +
    'Start'.padEnd(12) +
    'End'.padEnd(12);
  console.log(header);
  console.log('='.repeat(header.length));

  // Rows
  users.forEach((user) => {
    const username = (user.username || 'N/A').padEnd(20);
    const tier = (user.subscription_tier || 'free').padEnd(12);
    const status = getEffectiveStatus(user).padEnd(12);
    const price = `$${user.subscription_price || 0}`.padEnd(8);
    const start = formatDate(user.subscription_start_date).padEnd(12);
    const end = formatDate(user.subscription_end_date).padEnd(12);

    console.log(username + tier + status + price + start + end);
  });

  console.log();
}

/**
 * Parse command line arguments
 */
function parseArguments(args) {
  const filters = {};

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        showUsage();
        process.exit(0);
        break;

      case '--tier':
        if (i + 1 < args.length) {
          filters.tier = args[i + 1];
          i++; // Skip next argument
        }
        break;

      case '--status':
        if (i + 1 < args.length) {
          filters.status = args[i + 1];
          i++; // Skip next argument
        }
        break;

      case '--expired':
        filters.expired = true;
        break;

      case '--active':
        filters.active = true;
        break;

      default:
        console.error(`Unknown option: ${arg}`);
        showUsage();
        process.exit(1);
    }
  }

  return filters;
}

/**
 * Main execution function
 */
async function main() {
  try {
    const filters = parseArguments(process.argv);

    console.log('\n🔄 Loading subscription data...');

    // Ensure subscription columns exist
    await migrateSubscriptionColumns();

    // Get all users
    const allUsers = await getAllUsers();

    if (!allUsers || allUsers.length === 0) {
      console.log('📭 No users found in database.\n');
      return;
    }

    // Apply filters
    const filteredUsers = filterUsers(allUsers, filters);

    // Display results
    displayStats(allUsers);

    if (Object.keys(filters).length > 0) {
      console.log('🔍 Filtered Results:');
      Object.keys(filters).forEach((key) => {
        if (filters[key] === true) {
          console.log(`   ${key}: enabled`);
        } else {
          console.log(`   ${key}: ${filters[key]}`);
        }
      });
      console.log();
    }

    displayUsersTable(filteredUsers);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, filterUsers, getEffectiveStatus };
