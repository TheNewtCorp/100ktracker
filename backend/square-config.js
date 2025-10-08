// Load environment variables
require('dotenv').config();

const { SquareClient } = require('square');

// Initialize Square client according to official documentation
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  // Production environment is default
  // API version is latest by default (can override per request)
});

// Square configuration
const SQUARE_CONFIG = {
  applicationId: process.env.SQUARE_APPLICATION_ID,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT || 'production',
  currency: 'USD',
  country: 'US',

  // Webhook configuration
  webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '',

  // Application URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

// Square API client instances
const paymentsApi = client.payments;
const subscriptionsApi = client.subscriptions;
const customersApi = client.customers;
const catalogApi = client.catalog;
const checkoutApi = client.checkout;
const webhooksApi = client.webhooks;
const ordersApi = client.orders;
const locationsApi = client.locations;

module.exports = {
  client,
  SQUARE_CONFIG,
  paymentsApi,
  subscriptionsApi,
  customersApi,
  catalogApi,
  checkoutApi,
  webhooksApi,
  ordersApi,
  locationsApi,
};
