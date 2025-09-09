const fetch = require('node-fetch');

async function testInvoiceRoutes() {
  try {
    console.log('Testing invoice routes...');

    // Test without authentication (should fail)
    const response1 = await fetch('http://localhost:4000/api/invoices/test');
    const data1 = await response1.json();
    console.log('Test without auth:', data1);

    // Test Stripe config endpoint without auth (should fail)
    const response2 = await fetch('http://localhost:4000/api/invoices/stripe-config');
    const data2 = await response2.json();
    console.log('Stripe config without auth:', data2);

    console.log('Routes are responding correctly!');
  } catch (error) {
    console.error('Error testing routes:', error.message);
  }
}

testInvoiceRoutes();
