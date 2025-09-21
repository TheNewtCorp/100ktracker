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

async function testJWTTokenCreation(testUsername, testPassword) {
  console.log(`🔑 Testing JWT Token Creation for user: ${testUsername}`);

  try {
    const loginResponse = await makeRequest(`${PRODUCTION_URL}/api/login`, {
      method: 'POST',
      body: {
        username: testUsername,
        password: testPassword,
      },
    });

    if (loginResponse.status === 200 && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ JWT Token Successfully Created!');
      console.log(`   Token length: ${token.length} characters`);
      console.log(`   Token preview: ${token.substring(0, 50)}...`);

      // Decode JWT header and payload (without verification)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

          console.log(`   Token Type: ${header.typ || 'JWT'}`);
          console.log(`   Algorithm: ${header.alg || 'Unknown'}`);
          console.log(`   User ID: ${payload.id}`);
          console.log(`   Username: ${payload.username}`);
          console.log(`   Status: ${payload.status}`);

          if (payload.iat) {
            const issuedAt = new Date(payload.iat * 1000);
            console.log(`   Issued At: ${issuedAt.toISOString()}`);
          }

          if (payload.exp) {
            const expiresAt = new Date(payload.exp * 1000);
            const now = new Date();
            const timeUntilExpiry = expiresAt - now;
            const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));

            console.log(`   Expires At: ${expiresAt.toISOString()}`);
            console.log(`   Valid for: ${hoursUntilExpiry} hours`);
          }

          return { success: true, token, payload };
        }
      } catch (decodeError) {
        console.log('   ⚠️  Could not decode token details');
      }

      return { success: true, token };
    } else {
      console.log('❌ JWT Token Creation Failed');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Response:`, loginResponse.data);
      return { success: false, error: loginResponse.data };
    }
  } catch (error) {
    console.log('❌ Login request failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testTokenValidation(token) {
  console.log('\n🔍 Testing JWT Token Validation...');

  try {
    // Test token with a protected endpoint
    const protectedResponse = await makeRequest(`${PRODUCTION_URL}/api/watches`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (protectedResponse.status === 200) {
      console.log('✅ JWT Token is valid and accepted by server');
      console.log('   Successfully accessed protected endpoint');
      return true;
    } else {
      console.log('❌ JWT Token validation failed');
      console.log(`   Status: ${protectedResponse.status}`);
      console.log(`   Response:`, protectedResponse.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Token validation test failed:', error.message);
    return false;
  }
}

async function checkJWTTokenExistence() {
  console.log('🎯 Checking JWT Token Existence for All Production Users');
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

    // Try to get detailed user activity (this will fail without migration but let's try)
    console.log('📊 Attempting to get user JWT status...');
    const activityResponse = await makeRequest(`${PRODUCTION_URL}/api/admin/user-activity`);

    if (activityResponse.status === 200 && activityResponse.data.success) {
      // We have access to detailed user data
      console.log('✅ Retrieved detailed user data from production');
      analyzeUserJWTStatus(activityResponse.data);
    } else {
      // Fallback: Use existing endpoints and infer JWT status
      console.log('ℹ️  Detailed user endpoint not available - using fallback method');
      await analyzeJWTStatusFallback();
    }

    console.log('');
    console.log('� To test with other users:');
    console.log('   Add more test cases with known username/password combinations');
    console.log('   Or use the database migration to see all token activity');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

function analyzeUserJWTStatus(userData) {
  console.log('\n🔍 JWT Token Analysis (Direct Database Access)');
  console.log('='.repeat(60));

  const { allUsers, summary } = userData;

  console.log(`📊 Summary: ${summary.totalUsers} total users`);
  console.log('');

  const usersWithTokens = [];
  const usersWithoutTokens = [];
  const recentLogins = [];

  allUsers.forEach((user) => {
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status,
    };

    // Check if user has JWT-related data
    if (user.last_jwt_issued || user.login_count > 0 || user.status === 'active') {
      usersWithTokens.push({
        ...userInfo,
        lastJWT: user.last_jwt_issued || 'Unknown',
        loginCount: user.login_count || 'N/A',
        lastLogin: user.last_login_date || 'Unknown',
      });

      // Check for recent activity (last 7 days)
      if (user.last_jwt_issued) {
        const lastJWT = new Date(user.last_jwt_issued);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (lastJWT > weekAgo) {
          recentLogins.push(userInfo);
        }
      }
    } else {
      usersWithoutTokens.push(userInfo);
    }
  });

  console.log(`🟢 Users WITH JWT Tokens (${usersWithTokens.length}):`);
  usersWithTokens.forEach((user) => {
    console.log(`   • ${user.username} (ID: ${user.id})`);
    console.log(`     Email: ${user.email || 'None'}`);
    console.log(`     Status: ${user.status}`);
    console.log(`     Last JWT: ${user.lastJWT}`);
    console.log(`     Login Count: ${user.loginCount}`);
    console.log('');
  });

  if (usersWithoutTokens.length > 0) {
    console.log(`🔴 Users WITHOUT JWT Tokens (${usersWithoutTokens.length}):`);
    usersWithoutTokens.forEach((user) => {
      console.log(`   • ${user.username} (ID: ${user.id}) - ${user.status}`);
      console.log(`     Email: ${user.email || 'None'}`);
    });
    console.log('');
  }

  if (recentLogins.length > 0) {
    console.log(`⚡ Recent Activity (Last 7 days): ${recentLogins.length} users`);
    recentLogins.forEach((user) => {
      console.log(`   • ${user.username}`);
    });
    console.log('');
  }

  // Analysis
  const tokenRate = ((usersWithTokens.length / allUsers.length) * 100).toFixed(1);
  console.log('📈 JWT Token Analysis:');
  console.log(`   • ${usersWithTokens.length}/${allUsers.length} users have JWT tokens (${tokenRate}%)`);
  console.log(`   • ${recentLogins.length} users had recent JWT activity`);

  if (tokenRate >= 90) {
    console.log('   🎉 Excellent! Almost all users have logged in');
  } else if (tokenRate >= 70) {
    console.log('   ✅ Good login adoption rate');
  } else {
    console.log("   ⚠️  Many users haven't logged in yet");
  }
}

async function analyzeJWTStatusFallback() {
  console.log('\n🔍 JWT Token Analysis (Inference Method)');
  console.log('='.repeat(60));

  // Get user statistics
  const statsResponse = await makeRequest(`${PRODUCTION_URL}/api/admin/user-stats`);

  if (statsResponse.status !== 200 || !statsResponse.data.success) {
    console.log('❌ Cannot get user statistics');
    return;
  }

  const stats = statsResponse.data.stats;

  console.log('📊 User Status Analysis:');
  console.log(`   • Total Users: ${stats.total_users}`);
  console.log(`   • Active Users: ${stats.active_users} (have JWT tokens)`);
  console.log(`   • Pending Users: ${stats.pending_users} (no JWT tokens yet)`);
  console.log(`   • Invited Users: ${stats.invited_users} (no JWT tokens)`);
  console.log(`   • Suspended Users: ${stats.suspended_users}`);
  console.log('');

  // JWT Token Inference
  const usersWithJWT = stats.active_users;
  const usersWithoutJWT = stats.pending_users + stats.invited_users;
  const jwtRate = ((usersWithJWT / stats.total_users) * 100).toFixed(1);

  console.log('🔑 JWT Token Status (Inferred):');
  console.log(`   🟢 Users WITH JWT tokens: ${usersWithJWT}`);
  console.log(`   🔴 Users WITHOUT JWT tokens: ${usersWithoutJWT}`);
  console.log(`   📊 JWT Adoption Rate: ${jwtRate}%`);
  console.log('');

  console.log('💡 Status Meaning:');
  console.log('   • "Active" = User has logged in successfully (has JWT token)');
  console.log('   • "Pending" = User registered but never logged in (no JWT)');
  console.log('   • "Invited" = Email sent but user hasn\'t registered (no JWT)');
  console.log('');

  // Test JWT creation with the known user to verify system is working
  console.log('🧪 Verifying JWT System with Test Login...');
  const testResult = await testJWTTokenCreation('testuser999', 'testpass123');

  if (testResult.success) {
    console.log('✅ JWT system is working correctly');
  } else {
    console.log('❌ JWT system may have issues');
  }

  console.log('');
  console.log('🔧 For detailed JWT token data:');
  console.log('   Run database migration to add login tracking columns');
  console.log('   Then this script will show individual user JWT status');
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
  checkJWTTokenExistence();
}
