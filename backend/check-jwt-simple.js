#!/usr/bin/env node

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://one00ktracker.onrender.com';
const LOCAL_URL = 'http://localhost:3001';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const module = url.startsWith('https:') ? https : http;

    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = module.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            error: `Failed to parse JSON: ${e.message}`,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function checkProductionJWTActivity() {
  console.log('🎯 Checking JWT Activity in Production Database');
  console.log('📡 Server:', PRODUCTION_URL);
  console.log('');

  try {
    // First, check basic connectivity
    console.log('🔗 Testing server connectivity...');
    const healthCheck = await makeRequest(`${PRODUCTION_URL}/health`);

    if (healthCheck.status !== 200) {
      console.log('❌ Server not responding');
      return;
    }

    console.log('✅ Server is online');
    console.log('');

    // Check user stats first
    console.log('📊 Getting user statistics...');
    const statsResponse = await makeRequest(`${PRODUCTION_URL}/api/admin/user-stats`);

    if (statsResponse.status === 200 && statsResponse.data.success) {
      const stats = statsResponse.data.stats;
      console.log(`📈 Current User Stats:`);
      console.log(`   • Total users: ${stats.total_users}`);
      console.log(`   • Active users: ${stats.active_users}`);
      console.log(`   • Pending users: ${stats.pending_users}`);
      console.log(`   • Invited users: ${stats.invited_users}`);
      console.log(`   • Platinum users: ${stats.platinum_users || 0}`);
      console.log('');

      console.log('💡 Analysis:');
      if (stats.active_users > 0) {
        console.log(`✅ ${stats.active_users} users have logged in successfully`);
        console.log('   (These users have JWT tokens and login history)');
      }
      if (stats.pending_users > 0) {
        console.log(`⏳ ${stats.pending_users} users registered but haven't logged in yet`);
      }
      if (stats.invited_users > 0) {
        console.log(`📧 ${stats.invited_users} users were invited but haven't registered`);
      }
    } else {
      console.log('❌ Failed to get user statistics');
      console.log('Response:', statsResponse);
    }

    console.log('');
    console.log('🔍 JWT Activity Insights (without migration):');
    console.log('');
    console.log('📋 What we know:');
    console.log('   • "Active" users = Users who have successfully logged in');
    console.log('   • "Pending" users = Registered but never logged in');
    console.log('   • "Invited" users = Email sent but not registered');
    console.log('');
    console.log('💼 Business Insights:');

    if (statsResponse.data && statsResponse.data.stats) {
      const s = statsResponse.data.stats;
      const registrationRate = s.pending_users + s.active_users;
      const activationRate = (s.active_users / registrationRate) * 100;

      console.log(
        `   • Email to Registration: ${registrationRate}/${s.total_users} users (${((registrationRate / s.total_users) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   • Registration to Login: ${s.active_users}/${registrationRate} users (${activationRate.toFixed(1)}%)`,
      );

      if (s.active_users === s.total_users) {
        console.log('   🎉 Amazing! All users who registered have logged in!');
      } else if (activationRate > 50) {
        console.log('   ✅ Good activation rate - most registered users are logging in');
      } else {
        console.log("   ⚠️  Low activation rate - many users register but don't login");
      }
    }

    console.log('');
    console.log('🔧 For detailed JWT timestamps and login frequency:');
    console.log('   Run the database migration to add login tracking columns');
    console.log('   Then use: curl -s "' + PRODUCTION_URL + '/api/admin/user-activity"');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Command line options
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('JWT Activity Checker');
  console.log('');
  console.log('Usage:');
  console.log('  node check-jwt-simple.js              # Check production');
  console.log('  node check-jwt-simple.js --local      # Check local');
  console.log('  node check-jwt-simple.js --help       # Show this help');
  console.log('');
  console.log('This script checks user login activity without requiring database migration.');
  process.exit(0);
}

if (args.includes('--local')) {
  console.log('🏠 Local environment check not implemented yet');
  console.log('   Use: curl "http://localhost:3001/api/admin/user-stats"');
} else {
  checkProductionJWTActivity();
}
