// Debug the order retrieval issue
const { ordersApi } = require('./square-config');

// Generate UUID v4 using crypto module (Node.js built-in)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function debugOrderRetrieval() {
  console.log('🔍 Debugging order retrieval...');

  try {
    // Test creating an order first
    const orderRequest = {
      idempotencyKey: generateUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: [
          {
            name: 'Debug Test Item',
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(1000),
              currency: 'USD',
            },
          },
        ],
      },
    };

    console.log('Creating test order...');
    const createResult = await ordersApi.create(orderRequest);
    console.log('Order created:', createResult.order.id);

    // Now try to retrieve it - check available methods
    console.log('\nChecking ordersApi methods...');
    console.log('Available methods:', Object.getOwnPropertyNames(ordersApi));
    console.log('Available methods (inherited):', Object.getOwnPropertyNames(Object.getPrototypeOf(ordersApi)));

    // Try different method names
    try {
      const getResult = await ordersApi.retrieveOrder({
        orderId: createResult.order.id,
      });
      console.log('Order retrieved with retrieveOrder:', getResult.order.id);
    } catch (err1) {
      console.log('retrieveOrder failed:', err1.message);

      try {
        const getResult = await ordersApi.get({
          orderId: createResult.order.id,
        });
        console.log('Order retrieved with get(object):', getResult.order.id);
      } catch (err2) {
        console.log('get(object) failed:', err2.message);

        try {
          const getResult = await ordersApi.batchRetrieve({
            orderIds: [createResult.order.id],
            locationId: process.env.SQUARE_LOCATION_ID,
          });
          console.log('Order retrieved with batchRetrieve:', getResult.orders?.[0]?.id);
        } catch (err3) {
          console.log('batchRetrieve failed:', err3.message);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
      console.error('Error Body:', error.body);
    }
  }
}

debugOrderRetrieval();
