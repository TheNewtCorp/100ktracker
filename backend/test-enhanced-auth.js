// Test script for enhanced authentication
const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testAuthentication() {
  try {
    console.log('🧪 Testing Enhanced Authentication\n');

    // Test login with test_user (should have temporary password)
    console.log('1. Testing login with test_user...');
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      username: 'test_user',
      password: 'daolfUxHIjDA', // Password from earlier test
    });

    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.token;

    // Test getting user profile
    console.log('\n2. Testing user profile endpoint...');
    const profileResponse = await axios.get(`${API_BASE}/account/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Profile fetch successful!');
    console.log('Profile:', JSON.stringify(profileResponse.data, null, 2));

    // Test password change (if temporary password)
    if (loginResponse.data.temporaryPassword) {
      console.log('\n3. Testing password change for temporary password...');
      try {
        const changePasswordResponse = await axios.put(
          `${API_BASE}/account/password`,
          {
            currentPassword: 'daolfUxHIjDA',
            newPassword: 'NewSecurePassword123!',
            confirmPassword: 'NewSecurePassword123!',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log('✅ Password change successful!');
        console.log('Response:', JSON.stringify(changePasswordResponse.data, null, 2));

        // Test login with new password
        console.log('\n4. Testing login with new password...');
        const newLoginResponse = await axios.post(`${API_BASE}/login`, {
          username: 'test_user',
          password: 'NewSecurePassword123!',
        });

        console.log('✅ Login with new password successful!');
        console.log('Response:', JSON.stringify(newLoginResponse.data, null, 2));
      } catch (passwordError) {
        console.log('❌ Password change failed:', passwordError.response?.data || passwordError.message);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Backend server is not running on port 4000');
    console.log('Please start the server first: npm start');
    process.exit(1);
  }

  await testAuthentication();
}

main();
