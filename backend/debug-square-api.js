require('dotenv').config();

console.log('=== Deep Square API Debugging ===');

const https = require('https');

// Test with different API versions and request configurations
async function debugSquareAPI() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const environment = process.env.SQUARE_ENVIRONMENT || 'production';
  const hostname = environment === 'production' ? 'connect.squareup.com' : 'connect.squareupsandbox.com';

  console.log('Configuration:');
  console.log('- Environment:', environment);
  console.log('- Hostname:', hostname);
  console.log('- Token:', token ? token.substring(0, 20) + '...' : 'Missing');

  // Test different API versions
  const apiVersions = ['2025-09-24', '2024-07-17', '2023-10-18'];

  for (const version of apiVersions) {
    console.log(`\n🧪 Testing with Square-Version: ${version}`);

    const success = await testApiCall(hostname, token, version);
    if (success) {
      console.log(`✅ SUCCESS with API version ${version}!`);
      return version;
    }
  }

  // Test without version header
  console.log('\n🧪 Testing without Square-Version header');
  const success = await testApiCall(hostname, token, null);
  if (success) {
    console.log('✅ SUCCESS without version header!');
    return 'none';
  }

  return null;
}

async function testApiCall(hostname, token, version) {
  return new Promise((resolve) => {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Square-Node-SDK-Test/1.0',
    };

    if (version) {
      headers['Square-Version'] = version;
    }

    const options = {
      hostname: hostname,
      port: 443,
      path: '/v2/locations',
      method: 'GET',
      headers: headers,
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);

        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log(`   ✅ Locations found: ${result.locations?.length || 0}`);
            resolve(true);
          } catch (e) {
            console.log('   ❌ Failed to parse response');
            resolve(false);
          }
        } else {
          console.log(`   ❌ Failed with status ${res.statusCode}`);
          try {
            const errorData = JSON.parse(data);
            console.log(`   Error: ${errorData.errors?.[0]?.code || 'Unknown'}`);
            console.log(`   Detail: ${errorData.errors?.[0]?.detail || 'No details'}`);
          } catch (e) {
            console.log(`   Raw response: ${data.substring(0, 200)}`);
          }
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Request error: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ❌ Request timeout');
      resolve(false);
    });

    req.end();
  });
}

// Also test the token format
function analyzeToken() {
  const token = process.env.SQUARE_ACCESS_TOKEN;

  console.log('\n=== Token Analysis ===');
  console.log('Length:', token?.length);
  console.log('Starts with:', token?.substring(0, 10));
  console.log('Contains only valid chars:', /^[A-Za-z0-9_-]+$/.test(token || ''));

  // Check if it matches typical Square token patterns
  if (token?.startsWith('EAA')) {
    console.log('Token format: Looks like Square access token');
  } else if (token?.startsWith('sq0')) {
    console.log('Token format: Looks like Square application credential');
  } else {
    console.log('Token format: Unknown pattern');
  }
}

async function runDebugging() {
  analyzeToken();

  const workingVersion = await debugSquareAPI();

  if (workingVersion) {
    console.log(`\n🎉 Found working configuration with API version: ${workingVersion}`);
    console.log('Update your Square SDK configuration to use this version');
  } else {
    console.log('\n❌ No working configuration found');
    console.log('\nPossible issues:');
    console.log('1. Token is expired or invalid');
    console.log('2. Token is for wrong environment (prod vs sandbox)');
    console.log('3. Account/application has been disabled');
    console.log('4. Network/firewall issues');
    console.log('5. Token has insufficient permissions');
  }
}

runDebugging();
