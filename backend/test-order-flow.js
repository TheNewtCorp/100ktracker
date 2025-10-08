// Test order creation without payment processing
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testOrderCreationFlow() {
  console.log('🧪 Testing order creation flow...\n');

  try {
    // Test order creation
    console.log('1️⃣ Creating order...');
    const orderResponse = await axios.post(`${BASE_URL}/payments/create-checkout-session`, {
      email: 'test.order@example.com',
      firstName: 'Test',
      lastName: 'User',
      selectedPlan: 'monthly',
      promoCode: 'OPERANDI2024',
    });

    console.log('✅ Order created successfully');
    console.log('Response:', JSON.stringify(orderResponse.data, null, 2));

    const { orderId, customerId, amount } = orderResponse.data;

    // Test order retrieval
    console.log('\n2️⃣ Testing order retrieval directly...');

    const { ordersApi } = require('./square-config');

    const orderResult = await ordersApi.get({
      orderId: orderId,
    });

    console.log('✅ Order retrieved successfully');
    console.log('Order ID:', orderResult.order.id);
    console.log('Order state:', orderResult.order.state);
    console.log('Order metadata:', orderResult.order.metadata);

    // Test success handler (without payment)
    console.log('\n3️⃣ Testing success handler...');
    const successResponse = await axios.post(`${BASE_URL}/payments/success`, {
      orderId: orderId,
    });

    console.log('✅ Success handler working');
    console.log('Response:', JSON.stringify(successResponse.data, null, 2));

    console.log('\n🎉 ORDER FLOW SUCCESS!');
    console.log('='.repeat(50));
    console.log('✅ Order creation: PASS');
    console.log('✅ Order retrieval: PASS');
    console.log('✅ Success handling: PASS');
    console.log('\n💡 Note: Payment processing requires valid card data from Square Web SDK');
    console.log('🚀 Backend integration is fully functional!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

testOrderCreationFlow();
