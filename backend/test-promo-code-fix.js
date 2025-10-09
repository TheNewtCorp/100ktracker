/**
 * Test order creation without promo code to verify the fix
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test data without promo code
const testDataNoPromo = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'test.nopromo@example.com',
  selectedPlan: 'monthly',
  // No promoCode field
};

// Test data with empty promo code
const testDataEmptyPromo = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test.emptypromo@example.com',
  selectedPlan: 'monthly',
  promoCode: '',
};

// Test data with valid promo code
const testDataValidPromo = {
  firstName: 'Alice',
  lastName: 'Johnson',
  email: 'test.validpromo@example.com',
  selectedPlan: 'monthly',
  promoCode: 'OPERANDI2024',
};

async function testPromoCodeHandling() {
  console.log('🧪 Testing Promo Code Handling\n');

  try {
    // Test 1: No promo code field
    console.log('1️⃣ Testing without promo code field...');
    const response1 = await axios.post(`${API_BASE}/payments/create-checkout-session`, testDataNoPromo);
    console.log('✅ Success without promo code');
    console.log(`   Order ID: ${response1.data.orderId}`);
    console.log(`   Amount: $${response1.data.amount}\n`);

    // Test 2: Empty promo code
    console.log('2️⃣ Testing with empty promo code...');
    const response2 = await axios.post(`${API_BASE}/payments/create-checkout-session`, testDataEmptyPromo);
    console.log('✅ Success with empty promo code');
    console.log(`   Order ID: ${response2.data.orderId}`);
    console.log(`   Amount: $${response2.data.amount}\n`);

    // Test 3: Valid promo code
    console.log('3️⃣ Testing with valid promo code...');
    const response3 = await axios.post(`${API_BASE}/payments/create-checkout-session`, testDataValidPromo);
    console.log('✅ Success with valid promo code');
    console.log(`   Order ID: ${response3.data.orderId}`);
    console.log(`   Amount: $${response3.data.amount}`);
    console.log(`   Discount applied: ${response3.data.details.hasValidPromo}\n`);

    console.log('🎉 All promo code scenarios working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testPromoCodeHandling().catch(console.error);
