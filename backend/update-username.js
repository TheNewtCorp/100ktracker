#!/usr/bin/env node

const { initDB, closeDB, findUser, updateUsername } = require('./db');

async function updateUsernameWrapper(oldUsername, newUsername) {
  try {
    console.log(`🔄 Updating username from "${oldUsername}" to "${newUsername}"`);

    // Initialize database first
    await initDB();
    console.log('✅ Database initialized');

    // First check if old user exists
    findUser(oldUsername, (err, user) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        closeDB();
        return;
      }

      if (!user) {
        console.log(`❌ User "${oldUsername}" not found`);
        closeDB();
        return;
      }

      // Check if new username already exists
      findUser(newUsername, (err, existingUser) => {
        if (err) {
          console.error('❌ Database error:', err.message);
          closeDB();
          return;
        }

        if (existingUser) {
          console.log(`❌ Username "${newUsername}" already exists`);
          closeDB();
          return;
        }

        // Update the username using helper function
        updateUsername(oldUsername, newUsername, function (err) {
          if (err) {
            console.error('❌ Error updating username:', err.message);
          } else {
            console.log(`✅ Successfully updated username from "${oldUsername}" to "${newUsername}"`);
            console.log(`   - User ID: ${user.id}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Status: ${user.status}`);
          }
          closeDB();
        });
      });
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get usernames from command line arguments
const oldUsername = process.argv[2];
const newUsername = process.argv[3];

if (!oldUsername || !newUsername) {
  console.log('Usage: node update-username.js <old-username> <new-username>');
  console.log('Example: node update-username.js lidowatchlcub lidowatchclub');
  process.exit(1);
}

updateUsernameWrapper(oldUsername, newUsername);
