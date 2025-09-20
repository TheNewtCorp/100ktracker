#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://one00ktracker.onrender.com';
const LOCAL_URL = 'http://localhost:3001';

// JWT secret - you'll need to use the same secret as your production environment
const JWT_SECRET = process.env.JWT_SECRET;

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const module = url.startsWith('https:') ? https : http;

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = module.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: `Failed to parse JSON: ${e.message}`, rawData: data });
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

    req.end();
  });
}

function analyzeJWTActivity(users) {
  console.log('🔍 JWT Activity Analysis\n');

  if (!users || users.length === 0) {
    console.log('❌ No user data available');
    return;
  }

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;

  let activeUsers = [];
  let recentActivity = [];
  let oldActivity = [];
  let noActivity = [];

  users.forEach((user) => {
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
    };

    // Check if user has a current_jwt_token (this indicates recent login)
    if (user.current_jwt_token) {
      try {
        // Decode JWT to get issuance time (without verification for analysis)
        const decoded = jwt.decode(user.current_jwt_token);
        if (decoded && decoded.iat) {
          const issueTime = decoded.iat * 1000; // Convert to milliseconds
          const issueDate = new Date(issueTime);
          const timeAgo = now - issueTime;

          userInfo.lastJWTIssued = issueDate.toISOString();
          userInfo.timeAgo = formatTimeAgo(timeAgo);
          userInfo.jwtExpiry = decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'Unknown';

          if (timeAgo < oneDay) {
            recentActivity.push({ ...userInfo, category: 'Last 24 hours' });
          } else if (timeAgo < oneWeek) {
            recentActivity.push({ ...userInfo, category: 'Last week' });
          } else if (timeAgo < oneMonth) {
            oldActivity.push({ ...userInfo, category: 'Last month' });
          } else {
            oldActivity.push({ ...userInfo, category: 'Older than month' });
          }

          activeUsers.push(userInfo);
        } else {
          userInfo.lastJWTIssued = 'Invalid token format';
          noActivity.push(userInfo);
        }
      } catch (error) {
        userInfo.lastJWTIssued = `Token decode error: ${error.message}`;
        noActivity.push(userInfo);
      }
    } else {
      userInfo.lastJWTIssued = 'No JWT token found';
      noActivity.push(userInfo);
    }
  });

  // Display results
  console.log(`📊 Summary:`);
  console.log(`   Total users: ${users.length}`);
  console.log(`   Users with JWT tokens: ${activeUsers.length}`);
  console.log(`   Users without JWT tokens: ${noActivity.length}`);
  console.log(`   Recent activity (< 1 week): ${recentActivity.length}`);

  if (recentActivity.length > 0) {
    console.log('\n🟢 Recent JWT Activity (Last 7 days):');
    recentActivity.forEach((user) => {
      console.log(`   • ${user.username} (${user.email || 'no email'})`);
      console.log(`     Last JWT: ${user.timeAgo} ago (${user.lastJWTIssued})`);
      console.log(`     Status: ${user.status}`);
      console.log('');
    });
  }

  if (oldActivity.length > 0) {
    console.log('🟡 Older JWT Activity:');
    oldActivity.forEach((user) => {
      console.log(`   • ${user.username}: ${user.timeAgo} ago`);
    });
    console.log('');
  }

  if (noActivity.length > 0) {
    console.log('🔴 Users Without JWT Tokens (Never logged in):');
    noActivity.forEach((user) => {
      console.log(`   • ${user.username} (${user.email || 'no email'}) - Status: ${user.status}`);
    });
    console.log('');
  }
}

function formatTimeAgo(milliseconds) {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

async function checkJWTActivity(environment = 'production') {
  const url = environment === 'production' ? PRODUCTION_URL : LOCAL_URL;

  console.log(`🎯 Checking JWT Activity - ${environment.toUpperCase()}`);
  console.log(`📡 URL: ${url}`);
  console.log('');

  try {
    // Try to get user data from existing endpoints
    console.log('📋 Fetching user data...');

    // First try user-stats to see if we can connect
    const statsResponse = await makeRequest(`${url}/api/admin/user-stats`);

    if (!statsResponse.success) {
      console.log('❌ Failed to connect to server');
      console.log('Response:', statsResponse);
      return;
    }

    console.log(`✅ Connected to ${environment} server`);
    console.log(`📊 Stats: ${statsResponse.stats.total_users} total users, ${statsResponse.stats.active_users} active`);
    console.log('');

    // For JWT analysis, we need individual user data
    // Let's try a simple endpoint that lists users with their tokens
    console.log('🔍 Attempting to get detailed user data...');

    // We'll create a simple endpoint request to get users
    // This might not work yet, but let's try
    const usersResponse = await makeRequest(`${url}/api/users`);

    if (usersResponse.error || !usersResponse.users) {
      console.log('⚠️  Detailed user endpoint not available');
      console.log('💡 Can only show basic stats without migration');
      console.log(`   - Total users: ${statsResponse.stats.total_users}`);
      console.log(`   - Active users: ${statsResponse.stats.active_users}`);
      console.log('');
      console.log('🔧 To get JWT activity details, you need either:');
      console.log('   1. Deploy the user activity endpoints');
      console.log('   2. Run the database migration to add login tracking');
      return;
    }

    analyzeJWTActivity(usersResponse.users);
  } catch (error) {
    console.log('❌ Error checking JWT activity:', error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);
const environment = args.includes('--local') ? 'local' : 'production';

if (!JWT_SECRET && environment === 'local') {
  console.log('⚠️  Warning: JWT_SECRET not set in environment');
  console.log('   Some JWT decoding features may not work');
  console.log('');
}

checkJWTActivity(environment).catch(console.error);
