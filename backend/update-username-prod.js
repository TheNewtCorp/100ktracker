#!/usr/bin/env node

const PROD_API_BASE = 'https://one00ktracker.onrender.com';

async function updateProductionUsername(oldUsername, newUsername) {
  try {
    console.log(`🔄 Updating username in production from "${oldUsername}" to "${newUsername}"`);

    const response = await fetch(`${PROD_API_BASE}/api/admin/update-username`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        oldUsername,
        newUsername,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ ${result.message}`);
      console.log(`   - User ID: ${result.userId}`);
      console.log(`   - Email: ${result.email}`);
      return true;
    } else {
      console.log(`❌ Error: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
    return false;
  }
}

// Get usernames from command line arguments
const oldUsername = process.argv[2];
const newUsername = process.argv[3];

if (!oldUsername || !newUsername) {
  console.log('Usage: node update-username-prod.js <old-username> <new-username>');
  console.log('Example: node update-username-prod.js "Steve Adinson" "SteveAdinson"');
  console.log('');
  console.log('⚠️  This updates the username in the PRODUCTION database');
  process.exit(1);
}

updateProductionUsername(oldUsername, newUsername);
