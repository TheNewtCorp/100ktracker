#!/usr/bin/env node
// Test script for the new invoice API routes

const { migrateInvoiceTablesForRedesign } = require('./migrations-invoice-redesign');

async function testMigration() {
  try {
    console.log('Testing invoice table migration...');
    await migrateInvoiceTablesForRedesign();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testMigration();
}

module.exports = { testMigration };
