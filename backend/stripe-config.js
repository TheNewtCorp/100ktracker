const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY ||
    'sk_test_51S3JBa2S2jsL2lCFM3VCfQMu09lFxgRBrcdSGjHb32RWIbUAdGe7xy63qSYRtptrRjqMny1NWxkMqMDvangA5zeL00GzaCp6uk',
);

// Stripe configuration
const STRIPE_CONFIG = {
  publishableKey:
    process.env.STRIPE_PUBLISHABLE_KEY ||
    'pk_test_51S3JBa2S2jsL2lCFrDGWQRfjzTpKV6CEF4mrhZspD0HpLLuNfasq2KwTNmSU69LL3LSqoHumlUOOrNOwFVGnjuqe00LYX0rlyf',
  webhookEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET || '', // Will set up webhooks later
  currency: 'usd',
  country: 'US',
};

module.exports = {
  stripe,
  STRIPE_CONFIG,
};
