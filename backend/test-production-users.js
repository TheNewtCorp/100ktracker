#!/usr/bin/env node

/**
 * Test Production Database Connection and User Activity
 * This script helps test the admin endpoints and check production user data
 */

const https = require('https');
const http = require('http');

// Configuration
const PRODUCTION_URL = 'https://one00ktracker.onrender.com';
const LOCAL_URL = 'http://localhost:3001';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: jsonData });
          } catch (error) {
            resolve({ statusCode: res.statusCode, data: data, error: 'Invalid JSON' });
          }
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function checkProductionUserActivity() {
  console.log('🔍 Checking Production User Activity...\n');

  try {
    console.log('📊 Fetching user statistics from production...');
    const statsUrl = `${PRODUCTION_URL}/api/admin/user-stats`;
    console.log(`Making request to: ${statsUrl}`);

    const statsResult = await makeRequest(statsUrl);

    if (statsResult.statusCode === 200 && statsResult.data.success) {
      const stats = statsResult.data.stats;
      console.log('✅ Production Statistics:');
      console.log(`   Environment: ${statsResult.data.environment}`);
      console.log(`   Timestamp: ${statsResult.data.timestamp}`);
      console.log(`   Total Users: ${stats.total_users}`);
      console.log(`   ✅ Active Users: ${stats.active_users}`);
      console.log(`   ⏳ Pending Users: ${stats.pending_users}`);
      console.log(`   📧 Invited Users: ${stats.invited_users}`);
      console.log(`   🚫 Suspended Users: ${stats.suspended_users}`);
      console.log(`   💎 Platinum Users: ${stats.platinum_users}`);
      console.log(`   🔶 Operandi Users: ${stats.operandi_users}`);
    } else {
      console.log('❌ Failed to get production statistics');
      console.log(`   Status Code: ${statsResult.statusCode}`);
      console.log(`   Response: ${JSON.stringify(statsResult.data, null, 2)}`);
    }

    console.log('\n📋 Fetching detailed user activity...');
    const activityUrl = `${PRODUCTION_URL}/api/admin/user-activity`;
    console.log(`Making request to: ${activityUrl}`);

    const activityResult = await makeRequest(activityUrl);

    if (activityResult.statusCode === 200 && activityResult.data.success) {
      const data = activityResult.data;

      console.log('\n✅ Production User Activity:');
      console.log(`   Environment: ${data.environment}`);
      console.log(`   Total Users: ${data.summary.totalUsers}`);
      console.log(`   Active: ${data.summary.activeUsers}`);
      console.log(`   Pending: ${data.summary.pendingUsers}`);
      console.log(`   Invited: ${data.summary.invitedUsers}`);
      console.log(`   Paid Subscriptions: ${data.summary.paidSubscriptions}`);

      // Show users who have logged in
      if (data.usersByStatus.active && data.usersByStatus.active.length > 0) {
        console.log('\n🎉 Users Who Have Logged In:');
        data.usersByStatus.active.forEach((user) => {
          console.log(`   ✅ ${user.username} (${user.email})`);
          if (user.subscription_tier && user.subscription_tier !== 'free') {
            console.log(`      💳 Subscription: ${user.subscription_tier} (${user.subscription_status})`);
          }
        });
      } else {
        console.log('\n⏳ No users have logged in yet');
      }

      // Show pending users
      if (data.usersByStatus.pending && data.usersByStatus.pending.length > 0) {
        console.log('\n⏳ Users Awaiting First Login:');
        data.usersByStatus.pending.forEach((user) => {
          console.log(`   • ${user.username} (${user.email})`);
        });
      }

      // Show invited users
      if (data.usersByStatus.invited && data.usersByStatus.invited.length > 0) {
        console.log('\n📧 Users Invited (Awaiting Login):');
        data.usersByStatus.invited.forEach((user) => {
          console.log(`   • ${user.username} (${user.email})`);
        });
      }
    } else {
      console.log('❌ Failed to get production user activity');
      console.log(`   Status Code: ${activityResult.statusCode}`);
      console.log(`   Response: ${JSON.stringify(activityResult.data, null, 2)}`);
    }
  } catch (error) {
    console.error('❌ Error checking production:', error.message);
    console.log('\n💡 Tips:');
    console.log('   - Make sure your production server is running');
    console.log('   - Check that the admin endpoints are deployed');
    console.log('   - Verify the production URL is correct');
  }
}

async function checkLocalUserActivity() {
  console.log('\n🏠 Checking Local User Activity...\n');

  try {
    const statsUrl = `${LOCAL_URL}/api/admin/user-stats`;
    const statsResult = await makeRequest(statsUrl);

    if (statsResult.statusCode === 200) {
      console.log('✅ Local server is running and admin endpoints work');
      console.log(`   Local stats: ${JSON.stringify(statsResult.data.stats, null, 2)}`);
    } else {
      console.log('❌ Local server not responding or admin endpoints not working');
    }
  } catch (error) {
    console.log('❌ Local server not running');
    console.log('   Start it with: npm start or node server.js');
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 Production User Activity Checker

Usage:
  node test-production-users.js [options]

Options:
  --production-only    Only check production
  --local-only         Only check local
  --help              Show this help

Examples:
  node test-production-users.js                # Check both production and local
  node test-production-users.js --production-only
  node test-production-users.js --local-only
    `);
    return;
  }

  console.log('🚀 User Activity Checker');
  console.log('========================\n');

  if (!args.includes('--local-only')) {
    await checkProductionUserActivity();
  }

  if (!args.includes('--production-only')) {
    await checkLocalUserActivity();
  }

  console.log('\n✅ Check complete!');
}

main().catch(console.error);
