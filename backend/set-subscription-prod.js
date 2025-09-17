#!/usr/bin/env node

/**
 * CLI Script for Production Subscription Management
 *
 * This script allows administrators to set subscription tiers for users in production.
 * Similar to update-username.js but focused on subscription management.
 *
 * Usage:
 *   node set-subscription-prod.js <username> <tier> [duration_months]
 *
 * Examples:
 *   node set-subscription-prod.js john_doe platinum 12
 *   node set-subscription-prod.js jane_smith operandi 6
 *   node set-subscription-prod.js test_user free
 */

const path = require('path');
const fs = require('fs');

// Import database functions
const {
  getUserByUsername,
  setUserSubscriptionByUsername,
  getSubscriptionTierInfo,
  migrateSubscriptionColumns,
} = require('./db');

// Subscription tier validation
const VALID_TIERS = ['platinum', 'operandi', 'free'];
const TIER_INFO = {
  platinum: { price: 98, name: 'Platinum Tracker' },
  operandi: { price: 80, name: 'Operandi Challenge Tracker' },
  free: { price: 0, name: 'Free Tier' },
};

/**
 * Display usage instructions
 */
function showUsage() {
  console.log('\n📋 Subscription Management CLI');
  console.log('=============================\n');
  console.log('Usage: node set-subscription-prod.js <username> <tier> [duration_months]\n');
  console.log('Tiers:');
  console.log('  platinum - Platinum Tracker ($98/month)');
  console.log('  operandi - Operandi Challenge Tracker ($80/month)');
  console.log('  free     - Free Tier ($0/month)\n');
  console.log('Examples:');
  console.log('  node set-subscription-prod.js john_doe platinum 12');
  console.log('  node set-subscription-prod.js jane_smith operandi 6');
  console.log('  node set-subscription-prod.js test_user free\n');
  console.log('Notes:');
  console.log('  - duration_months is optional for paid tiers (defaults to 1 month)');
  console.log('  - duration_months is ignored for free tier');
  console.log('  - Script will create backup before making changes');
}

/**
 * Validate command line arguments
 */
function validateArguments(args) {
  if (args.length < 4) {
    console.error('❌ Error: Missing required arguments\n');
    showUsage();
    return false;
  }

  const [, , username, tier, durationMonths] = args;

  if (!username || username.trim() === '') {
    console.error('❌ Error: Username cannot be empty\n');
    return false;
  }

  if (!VALID_TIERS.includes(tier)) {
    console.error(`❌ Error: Invalid tier "${tier}". Valid tiers: ${VALID_TIERS.join(', ')}\n`);
    return false;
  }

  if (durationMonths && tier === 'free') {
    console.log('⚠️  Warning: Duration ignored for free tier');
  }

  if (durationMonths && (isNaN(durationMonths) || parseInt(durationMonths) <= 0)) {
    console.error('❌ Error: Duration must be a positive number\n');
    return false;
  }

  return true;
}

/**
 * Create database backup before making changes
 */
function createBackup() {
  try {
    const dbPath = path.join(__dirname, 'db', 'users.sqlite');
    const backupPath = path.join(__dirname, 'db', `users_backup_${Date.now()}.sqlite`);

    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`📁 Database backup created: ${backupPath}`);
      return true;
    } else {
      console.error('❌ Error: Database file not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    return false;
  }
}

/**
 * Calculate subscription end date
 */
function calculateEndDate(durationMonths = 1) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));
  return endDate;
}

/**
 * Format date for display
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv;

  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    return;
  }

  // Validate arguments
  if (!validateArguments(args)) {
    process.exit(1);
  }

  const [, , username, tier, durationMonths] = args;
  const duration = parseInt(durationMonths) || 1;

  console.log('\n🔧 Subscription Management Tool');
  console.log('===============================\n');

  try {
    // Ensure subscription columns exist
    console.log('🔄 Checking database schema...');
    await migrateSubscriptionColumns();
    console.log('✅ Database schema verified\n');

    // Create backup
    if (!createBackup()) {
      process.exit(1);
    }

    // Check if user exists
    console.log(`🔍 Looking up user: ${username}...`);
    const user = await getUserByUsername(username);

    if (!user) {
      console.error(`❌ Error: User "${username}" not found`);
      process.exit(1);
    }

    console.log('✅ User found');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email || 'N/A'}\n`);

    // Calculate subscription details
    const startDate = new Date();
    let endDate = null;
    let status = 'free';

    if (tier !== 'free') {
      endDate = calculateEndDate(duration);
      status = 'active';
    }

    const tierInfo = TIER_INFO[tier];

    // Display subscription details
    console.log('📋 Subscription Details:');
    console.log(`   Tier: ${tierInfo.name}`);
    console.log(`   Price: $${tierInfo.price}/month`);
    console.log(`   Status: ${status}`);
    console.log(`   Start Date: ${formatDate(startDate)}`);
    if (endDate) {
      console.log(`   End Date: ${formatDate(endDate)}`);
      console.log(`   Duration: ${duration} month${duration > 1 ? 's' : ''}`);
    }
    console.log();

    // Confirm action
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question('❓ Continue with subscription update? (y/N): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled');
      process.exit(0);
    }

    // Update subscription
    console.log('\n🔄 Updating subscription...');

    const result = await setUserSubscriptionByUsername(
      username,
      tier,
      status,
      tierInfo.price,
      startDate.toISOString(),
      endDate ? endDate.toISOString() : null,
      null, // stripe_subscription_id - set when Stripe is integrated
    );

    if (result) {
      console.log('✅ Subscription updated successfully!\n');

      // Display updated subscription info
      const updatedUser = await getUserByUsername(username);
      console.log('📊 Updated Subscription Status:');
      console.log(`   User: ${updatedUser.username}`);
      console.log(`   Tier: ${updatedUser.subscription_tier}`);
      console.log(`   Status: ${updatedUser.subscription_status}`);
      console.log(`   Price: $${updatedUser.subscription_price}/month`);
      if (updatedUser.subscription_start_date) {
        console.log(`   Start: ${formatDate(new Date(updatedUser.subscription_start_date))}`);
      }
      if (updatedUser.subscription_end_date) {
        console.log(`   End: ${formatDate(new Date(updatedUser.subscription_end_date))}`);
      }
      console.log();
    } else {
      console.error('❌ Error: Failed to update subscription');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n❌ Operation cancelled by user');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, validateArguments, VALID_TIERS, TIER_INFO };
