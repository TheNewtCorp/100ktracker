const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY ||
    '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',
);

// Stripe configuration
const STRIPE_CONFIG = {
  publishableKey:
    process.env.STRIPE_PUBLISHABLE_KEY ||
    'pk_live_51SDDT1AXjei6j62h4rdul8gsqudzfYw0tlN5PPuZKLeCoLnv4IeDbeZUJOhCTKYIPrxv4fbqUuLPhJqe7hMKOa3500zgXMr4ls',
  webhookEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET || '', // Will set up webhooks later
  currency: 'usd',
  country: 'US',
};

module.exports = {
  stripe,
  STRIPE_CONFIG,
};
