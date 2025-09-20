#!/usr/bin/env node

/**
 * Simple user status checker for manually created accounts
 * Shows who has logged in vs who hasn't
 */

const { initDB, closeDB, getDb } = require('./db');

async function checkUserLoginStatus() {
  try {
    await initDB();
    const db = getDb();

    console.log('🔐 User Login Status Check\n');

    // Get users and try to determine login activity
    const users = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          id,
          username,
          email,
          status,
          hashed_password
        FROM users 
        WHERE id > 1
        ORDER BY id DESC
      `,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        },
      );
    });

    console.log('Recent Users Created:');
    console.log('=====================\n');

    const recentUsers = [];
    const loggedInUsers = [];
    const neverLoggedIn = [];

    users.forEach((user) => {
      const userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
      };

      recentUsers.push(userInfo);

      // Users with 'active' status have likely logged in
      // Users with 'pending' or 'invited' status haven't logged in yet
      if (user.status === 'active') {
        loggedInUsers.push(userInfo);
      } else {
        neverLoggedIn.push(userInfo);
      }
    });

    // Show recent users you created
    console.log('👤 Recently Created Users:');
    recentUsers.slice(0, 10).forEach((user) => {
      const statusEmoji =
        user.status === 'active' ? '✅' : user.status === 'pending' ? '⏳' : user.status === 'invited' ? '📧' : '❓';
      console.log(`   ${statusEmoji} ${user.username} (${user.email}) - ${user.status}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total Users: ${recentUsers.length}`);
    console.log(`   ✅ Have Logged In: ${loggedInUsers.length}`);
    console.log(`   ⏳ Never Logged In: ${neverLoggedIn.length}`);

    if (neverLoggedIn.length > 0) {
      console.log("\n📧 Users Who Haven't Logged In Yet:");
      console.log("   (These users received invitations but haven't activated their accounts)\n");

      neverLoggedIn.forEach((user) => {
        console.log(`   • ${user.username}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Status: ${user.status}`);
        console.log(
          `     Action: ${user.status === 'pending' ? 'Waiting for first login' : 'Invitation sent, waiting for login'}`,
        );
        console.log('');
      });

      console.log('💡 Tips:');
      console.log('   - Check if invitation emails were delivered');
      console.log('   - Users might need to check spam/junk folders');
      console.log('   - You can resend invitations if needed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await closeDB();
  }
}

// Run the check
checkUserLoginStatus();
