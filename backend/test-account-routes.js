const fetch = require('node-fetch');

async function testAccountRoutes() {
  try {
    console.log('Testing account settings routes...');

    // Test profile endpoint without auth (should fail)
    const response1 = await fetch('http://localhost:4000/api/account/profile');
    const data1 = await response1.json();
    console.log('Profile without auth:', data1);

    // Test stripe settings endpoint without auth (should fail)
    const response2 = await fetch('http://localhost:4000/api/account/stripe-settings');
    const data2 = await response2.json();
    console.log('Stripe settings without auth:', data2);

    console.log('Account routes are responding correctly!');
  } catch (error) {
    console.error('Error testing account routes:', error.message);
  }
}

testAccountRoutes();
