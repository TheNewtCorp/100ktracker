#!/usr/bin/env node

const { findUser, initDB, closeDB } = require('./db');

async function verifyUser(username) {
  try {
    console.log(`🔍 Searching for user: ${username}`);

    // Initialize database first
    await initDB();
    console.log('✅ Database initialized');

    // Search for the user
    findUser(username, async (err, user) => {
      if (err) {
        console.error('❌ Database error:', err.message);
      } else if (user) {
        console.log(`✅ User "${username}" found:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Username: ${user.username}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Status: ${user.status || 'active'}`);
        console.log(`   - Created: ${user.created_at}`);
        console.log(`   - First Login: ${user.first_login_at || 'Never'}`);
      } else {
        console.log(`❌ User "${username}" not found in database`);
      }

      try {
        await closeDB();
        console.log('Database connection closed');
      } catch (closeErr) {
        console.error('Error closing database:', closeErr.message);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.log('Usage: node verify-user.js <username>');
  console.log('Example: node verify-user.js lidowatchclub');
  process.exit(1);
}

verifyUser(username);
