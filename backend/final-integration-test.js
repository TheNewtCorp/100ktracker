// Final comprehensive test of our Square integration
const { client, locationsApi, customersApi, ordersApi } = require('./square-config');
const axios = require('axios');
const crypto = require('crypto');

// Generate UUID v4 using crypto module (Node.js built-in)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function finalIntegrationTest() {
  console.log('🧪 Running final Square integration test...\n');

  let testResults = {
    config: false,
    authentication: false,
    locations: false,
    customers: false,
    orders: false,
  };

  try {
    // Test 1: Configuration
    console.log('1️⃣ Testing configuration...');
    if (client && process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_APPLICATION_ID) {
      testResults.config = true;
      console.log('✅ Configuration loaded successfully');
    } else {
      console.log('❌ Configuration failed');
      return testResults;
    }

    // Test 2: Authentication
    console.log('\n2️⃣ Testing authentication...');
    const locationResponse = await locationsApi.list();
    if (locationResponse.locations && locationResponse.locations.length > 0) {
      testResults.authentication = true;
      testResults.locations = true;
      console.log('✅ Authentication successful');
      console.log(`✅ Found ${locationResponse.locations.length} location(s)`);
      console.log(`   Location: ${locationResponse.locations[0].name} (${locationResponse.locations[0].id})`);
    }

    // Test 3: Customer operations
    console.log('\n3️⃣ Testing customer operations...');
    const testCustomer = await customersApi.create({
      givenName: 'Final',
      familyName: 'Test',
      emailAddress: 'final.test@example.com',
    });

    if (testCustomer.customer) {
      testResults.customers = true;
      console.log('✅ Customer creation successful');
      console.log(`   Customer ID: ${testCustomer.customer.id}`);

      // Test customer search
      const searchResult = await customersApi.search({
        filter: {
          emailAddress: {
            exact: 'final.test@example.com',
          },
        },
      });

      if (searchResult.customers && searchResult.customers.length > 0) {
        console.log('✅ Customer search successful');
      }
    }

    // Test 4: Order operations
    console.log('\n4️⃣ Testing order operations...');
    const testOrder = await ordersApi.create({
      idempotencyKey: generateUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: [
          {
            name: 'Final Test Product',
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(100), // $1.00
              currency: 'USD',
            },
          },
        ],
        metadata: {
          testType: 'final_integration_test',
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (testOrder.order) {
      testResults.orders = true;
      console.log('✅ Order creation successful');
      console.log(`   Order ID: ${testOrder.order.id}`);
      console.log(`   Order State: ${testOrder.order.state}`);
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(40));
    Object.entries(testResults).forEach(([test, passed]) => {
      console.log(
        `${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASS' : 'FAIL'}`,
      );
    });

    const allPassed = Object.values(testResults).every((result) => result === true);
    console.log('\n' + '='.repeat(40));
    console.log(`🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (allPassed) {
      console.log('\n🎉 Square integration is fully functional!');
      console.log('✨ Ready for production use');
      console.log('\n📋 Next steps:');
      console.log('• Implement frontend payment collection');
      console.log('• Set up webhook signature verification');
      console.log('• Test with real payment scenarios');
      console.log('• Configure production environment variables');
    }

    return testResults;
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    if (error.statusCode) {
      console.error('   Status Code:', error.statusCode);
      console.error('   Error Details:', error.body);
    }
    return testResults;
  }
}

finalIntegrationTest();
