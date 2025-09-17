#!/usr/bin/env node

/**
 * Migration Strategy for Existing Users
 *
 * This script helps migrate existing users to appropriate subscription tiers
 * based on their usage patterns, payment history, or admin decisions.
 *
 * Migration strategies:
 * 1. Blanket free tier assignment (safe default)
 * 2. Payment history analysis (if payment data exists)
 * 3. Usage-based assignment (based on watch counts, etc.)
 * 4. Manual CSV import for specific assignments
 *
 * Usage:
 *   node migrate-users-subscriptions.js [strategy] [options]
 *
 * Strategies:
 *   free-all               Assign all users to free tier (default)
 *   payment-analysis       Analyze payment history and assign tiers
 *   usage-based            Assign based on usage patterns
 *   csv-import <file>      Import specific assignments from CSV
 *   preview                Preview migration without making changes
 */

const path = require('path');
const fs = require('fs');
const { getAllUsers, getUserWatches, setUserSubscriptionByUsername, migrateSubscriptionColumns } = require('./db');

// Migration strategies
const STRATEGIES = {
  'free-all': 'Assign all users to free tier',
  'payment-analysis': 'Analyze payment history and assign tiers',
  'usage-based': 'Assign based on usage patterns',
  'csv-import': 'Import specific assignments from CSV file',
  preview: 'Preview migration without making changes',
};

/**
 * Display usage instructions
 */
function showUsage() {
  console.log('\n🔄 User Subscription Migration Tool');
  console.log('===================================\n');
  console.log('Usage: node migrate-users-subscriptions.js [strategy] [options]\n');
  console.log('Strategies:');
  Object.keys(STRATEGIES).forEach((key) => {
    console.log(`  ${key.padEnd(18)} ${STRATEGIES[key]}`);
  });
  console.log('\nExamples:');
  console.log('  node migrate-users-subscriptions.js preview');
  console.log('  node migrate-users-subscriptions.js free-all');
  console.log('  node migrate-users-subscriptions.js usage-based');
  console.log('  node migrate-users-subscriptions.js csv-import users-subscriptions.csv\n');
  console.log('CSV Format (for csv-import):');
  console.log('  username,tier,duration_months');
  console.log('  john_doe,platinum,12');
  console.log('  jane_smith,operandi,6');
  console.log('  free_user,free,0\n');
  console.log('Notes:');
  console.log('  - Always creates backup before making changes');
  console.log('  - Use "preview" to see changes before applying');
  console.log('  - Free tier assignment is the safest default');
}

/**
 * Create database backup
 */
function createBackup() {
  try {
    const dbPath = path.join(__dirname, 'db', 'users.sqlite');
    const backupPath = path.join(__dirname, 'db', `users_migration_backup_${Date.now()}.sqlite`);

    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`📁 Migration backup created: ${backupPath}`);
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
 * Analyze user usage patterns
 */
async function analyzeUsage(user) {
  return new Promise((resolve) => {
    getUserWatches(user.id, (err, watches) => {
      if (err) {
        console.log(`   Warning: Could not analyze usage for ${user.username}`);
        resolve({ watchCount: 0, totalValue: 0, avgValue: 0 });
        return;
      }

      const watchCount = watches ? watches.length : 0;
      const totalValue = watches
        ? watches.reduce((sum, watch) => {
            const value = parseFloat(watch.purchase_price || 0);
            return sum + (isNaN(value) ? 0 : value);
          }, 0)
        : 0;

      const avgValue = watchCount > 0 ? totalValue / watchCount : 0;

      resolve({ watchCount, totalValue, avgValue });
    });
  });
}

/**
 * Suggest tier based on usage patterns
 */
function suggestTierFromUsage(usage) {
  const { watchCount, totalValue, avgValue } = usage;

  // High usage users - suggest Platinum
  if (watchCount >= 20 || totalValue >= 50000 || avgValue >= 5000) {
    return { tier: 'platinum', reason: 'High usage (20+ watches or $50k+ total value)' };
  }

  // Moderate usage users - suggest Operandi
  if (watchCount >= 5 || totalValue >= 10000 || avgValue >= 2000) {
    return { tier: 'operandi', reason: 'Moderate usage (5+ watches or $10k+ total value)' };
  }

  // Low usage users - suggest Free
  return { tier: 'free', reason: 'Low usage or new user' };
}

/**
 * Parse CSV file for specific assignments
 */
function parseCSV(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: CSV file not found: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');

    if (lines.length < 2) {
      console.error('❌ Error: CSV file must have header and at least one data row');
      return null;
    }

    const header = lines[0].toLowerCase();
    if (!header.includes('username') || !header.includes('tier')) {
      console.error('❌ Error: CSV must have "username" and "tier" columns');
      return null;
    }

    const assignments = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;

      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;

      const [username, tier, durationMonths] = parts;

      if (!username || !tier) {
        console.log(`   Skipping invalid line ${i + 1}: ${line}`);
        continue;
      }

      if (!['platinum', 'operandi', 'free'].includes(tier)) {
        console.log(`   Skipping invalid tier "${tier}" for ${username}`);
        continue;
      }

      assignments.push({
        username,
        tier,
        durationMonths: parseInt(durationMonths) || (tier === 'free' ? 0 : 1),
      });
    }

    return assignments;
  } catch (error) {
    console.error('❌ Error parsing CSV:', error.message);
    return null;
  }
}

/**
 * Execute migration strategy
 */
async function executeMigration(strategy, options = {}) {
  console.log(`\n🔄 Executing migration strategy: ${strategy}`);

  try {
    // Ensure subscription columns exist
    await migrateSubscriptionColumns();

    // Get all users
    const users = await getAllUsers();
    console.log(`📊 Found ${users.length} users to migrate\n`);

    const migrations = [];

    switch (strategy) {
      case 'free-all':
        users.forEach((user) => {
          migrations.push({
            username: user.username,
            tier: 'free',
            reason: 'Blanket free tier assignment',
            durationMonths: 0,
          });
        });
        break;

      case 'usage-based':
        console.log('🔍 Analyzing user usage patterns...');
        for (const user of users) {
          const usage = await analyzeUsage(user);
          const suggestion = suggestTierFromUsage(usage);

          migrations.push({
            username: user.username,
            tier: suggestion.tier,
            reason: suggestion.reason,
            durationMonths: suggestion.tier === 'free' ? 0 : 1,
            usage,
          });
        }
        break;

      case 'csv-import':
        if (!options.csvFile) {
          console.error('❌ Error: CSV file required for csv-import strategy');
          return false;
        }

        const assignments = parseCSV(options.csvFile);
        if (!assignments) return false;

        // Match assignments with users
        assignments.forEach((assignment) => {
          const user = users.find((u) => u.username === assignment.username);
          if (user) {
            migrations.push({
              username: assignment.username,
              tier: assignment.tier,
              reason: 'CSV import assignment',
              durationMonths: assignment.durationMonths,
            });
          } else {
            console.log(`   Warning: User "${assignment.username}" not found in database`);
          }
        });
        break;

      case 'payment-analysis':
        // Placeholder - would analyze payment history if available
        console.log('💡 Payment analysis not implemented - falling back to free tier');
        users.forEach((user) => {
          migrations.push({
            username: user.username,
            tier: 'free',
            reason: 'No payment history found',
            durationMonths: 0,
          });
        });
        break;

      default:
        console.error(`❌ Error: Unknown strategy "${strategy}"`);
        return false;
    }

    // Display migration plan
    console.log('📋 Migration Plan:');
    console.log('==================');

    const stats = { platinum: 0, operandi: 0, free: 0 };

    migrations.forEach((migration, index) => {
      const { username, tier, reason, usage } = migration;
      stats[tier]++;

      console.log(`${(index + 1).toString().padStart(3)}. ${username.padEnd(20)} → ${tier.padEnd(10)} (${reason})`);

      if (usage && strategy === 'usage-based') {
        console.log(`     Usage: ${usage.watchCount} watches, $${usage.totalValue.toFixed(0)} total value`);
      }
    });

    console.log('\n📈 Migration Summary:');
    console.log(`     Platinum: ${stats.platinum} users`);
    console.log(`     Operandi: ${stats.operandi} users`);
    console.log(`     Free: ${stats.free} users`);
    console.log(`     Total: ${migrations.length} users\n`);

    if (options.preview) {
      console.log('👁️  Preview mode - no changes made');
      return true;
    }

    // Confirm migration
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question('❓ Continue with migration? (y/N): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled');
      return false;
    }

    // Create backup
    if (!createBackup()) {
      return false;
    }

    // Execute migrations
    console.log('\n🚀 Executing migrations...');
    let successCount = 0;
    let errorCount = 0;

    for (const migration of migrations) {
      try {
        const { username, tier, durationMonths } = migration;

        const startDate = new Date();
        let endDate = null;
        let status = 'free';
        let price = 0;

        if (tier !== 'free') {
          const duration = parseInt(durationMonths) || 1;
          endDate = new Date();
          endDate.setMonth(endDate.getMonth() + duration);
          status = 'active';

          if (tier === 'platinum') price = 98;
          else if (tier === 'operandi') price = 80;
        }

        const result = await setUserSubscriptionByUsername(
          username,
          tier,
          status,
          price,
          startDate.toISOString(),
          endDate ? endDate.toISOString() : null,
          null,
        );

        if (result) {
          successCount++;
          console.log(`   ✅ ${username}: ${tier}`);
        } else {
          errorCount++;
          console.log(`   ❌ ${username}: Failed`);
        }
      } catch (error) {
        errorCount++;
        console.log(`   ❌ ${migration.username}: ${error.message}`);
      }
    }

    console.log('\n🎉 Migration Complete!');
    console.log(`     Success: ${successCount} users`);
    console.log(`     Errors: ${errorCount} users`);

    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv;

  if (args.includes('--help') || args.includes('-h') || args.length === 2) {
    showUsage();
    return;
  }

  const strategy = args[2] || 'preview';
  const options = {};

  // Parse additional arguments
  if (strategy === 'csv-import' && args[3]) {
    options.csvFile = args[3];
  }

  if (strategy === 'preview') {
    options.preview = true;
  }

  if (!STRATEGIES[strategy]) {
    console.error(`❌ Error: Unknown strategy "${strategy}"`);
    showUsage();
    process.exit(1);
  }

  console.log('\n🔧 User Subscription Migration');
  console.log('==============================');

  const success = await executeMigration(strategy, options);

  if (!success) {
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n❌ Migration cancelled by user');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  main,
  analyzeUsage,
  suggestTierFromUsage,
  parseCSV,
  STRATEGIES,
};
