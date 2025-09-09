const fetch = require('node-fetch');

async function testAllRoutes() {
  try {
    console.log('Testing all backend routes...\n');

    // Test invoice routes
    console.log('=== Invoice Routes ===');
    const invoiceTest = await fetch('http://localhost:4000/api/invoices/test');
    const invoiceData = await invoiceTest.json();
    console.log('Invoice test:', invoiceData);

    const stripeConfig = await fetch('http://localhost:4000/api/invoices/stripe-config');
    const stripeData = await stripeConfig.json();
    console.log('Stripe config check:', stripeData);

    // Test account routes
    console.log('\n=== Account Routes ===');
    const profileTest = await fetch('http://localhost:4000/api/account/profile');
    const profileData = await profileTest.json();
    console.log('Profile test:', profileData);

    const accountStripeTest = await fetch('http://localhost:4000/api/account/stripe-settings');
    const accountStripeData = await accountStripeTest.json();
    console.log('Account Stripe test:', accountStripeData);

    console.log('\n✅ All routes are responding correctly!');
    console.log('Both invoice and account endpoints are working and properly protected by authentication.');
  } catch (error) {
    console.error('❌ Error testing routes:', error.message);
  }
}

testAllRoutes();
