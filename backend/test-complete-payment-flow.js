// Test the complete Square payment flow end-to-end
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testCompletePaymentFlow() {
  console.log('🧪 Testing complete Square payment flow...\n');

  try {
    // Step 1: Create checkout session (order)
    console.log('1️⃣ Creating checkout session...');
    const orderResponse = await axios.post(`${BASE_URL}/payments/create-checkout-session`, {
      email: 'test.e2e@example.com',
      firstName: 'Test',
      lastName: 'User',
      selectedPlan: 'monthly',
      promoCode: 'OPERANDI2024',
    });

    console.log('✅ Order created successfully');
    console.log('Order ID:', orderResponse.data.orderId);
    console.log('Customer ID:', orderResponse.data.customerId);
    console.log('Amount:', orderResponse.data.amount);

    const { orderId, customerId, amount } = orderResponse.data;

    // Step 2: Simulate payment token (normally comes from Square Web SDK)
    console.log('\n2️⃣ Simulating payment token...');
    // In real scenario, this token would come from Square's card form
    const mockPaymentToken = 'cnon:card-nonce-ok'; // Square's test token
    const idempotencyKey = `test-payment-${Date.now()}`;

    console.log('Payment token:', mockPaymentToken);
    console.log('Idempotency key:', idempotencyKey.substring(0, 20) + '...');

    // Step 3: Process payment
    console.log('\n3️⃣ Processing payment...');
    try {
      const paymentResponse = await axios.post(`${BASE_URL}/payments/process-payment`, {
        orderId: orderId,
        paymentToken: mockPaymentToken,
        amount: amount * 100, // Convert to cents
        idempotencyKey: idempotencyKey,
      });

      console.log('✅ Payment processed successfully');
      console.log('Payment ID:', paymentResponse.data.paymentId);
      console.log('Payment status:', paymentResponse.data.payment?.status);

      // Step 4: Handle success
      console.log('\n4️⃣ Handling payment success...');
      const successResponse = await axios.post(`${BASE_URL}/payments/success`, {
        orderId: orderId,
      });

      console.log('✅ Payment success handled');
      console.log('Customer details:', successResponse.data.customer);

      console.log('\n🎉 END-TO-END PAYMENT FLOW SUCCESS!');
      console.log('='.repeat(50));
      console.log('✅ Order creation: PASS');
      console.log('✅ Payment processing: PASS');
      console.log('✅ Success handling: PASS');
      console.log('\n🚀 Square payment integration is fully functional!');
    } catch (paymentError) {
      console.error('\n❌ Payment processing failed:', paymentError.response?.data || paymentError.message);

      if (paymentError.response?.data?.code === 'GENERIC_DECLINE') {
        console.log('\n💡 Note: This error is expected when using test tokens in production environment.');
        console.log('In real scenario with valid card data, payment would succeed.');
      }
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

testCompletePaymentFlow();
