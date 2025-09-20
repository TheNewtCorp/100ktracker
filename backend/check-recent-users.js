#!/usr/bin/env node

/**
 * Quick script to check recent users and their activity
 * Works with current database schema without requiring new columns
 */

const { initDB, closeDB, getDb } = require('./db');

async function checkRecentUsers() {
  try {
    await initDB();
    const db = getDb();

    console.log('🔍 Checking Recent User Activity...\n');

    // Get all users with available information
    const users = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          id,
          username,
          email,
          status,
          invited_by
        FROM users 
        ORDER BY id DESC
        LIMIT 20
      `,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        },
      );
    });

    console.log('📋 Recent Users (Last 20):');
    console.log('='.repeat(80));
    console.log('ID'.padEnd(4), '| Username'.padEnd(18), '| Email'.padEnd(25), '| Status'.padEnd(10), '| Created');
    console.log('-'.repeat(80));

    users.forEach((user) => {
      const id = user.id.toString().padEnd(3);
      const username = (user.username || 'N/A').padEnd(17);
      const email = (user.email || 'N/A').padEnd(24);
      const status = (user.status || 'unknown').padEnd(9);
      const created = `ID: ${user.id}`;

      console.log(`${id} | ${username} | ${email} | ${status} | ${created}`);
    });

    // Get status summary
    const statusSummary = users.reduce((acc, user) => {
      const status = user.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Status Summary:');
    Object.entries(statusSummary).forEach(([status, count]) => {
      const indicator = status === 'active' ? '✅' : status === 'pending' ? '⏳' : '❓';
      console.log(`   ${indicator} ${status}: ${count} users`);
    });

    // Check for recent invitations (users with pending status)
    const pendingUsers = users.filter((u) => u.status === 'pending');

    if (pendingUsers.length > 0) {
      console.log("\n⏳ Users Who Haven't Logged In Yet:");
      console.log('-'.repeat(50));
      pendingUsers.forEach((user) => {
        console.log(`   • ${user.username} (${user.email})`);
      });
    }

    console.log(`\nℹ️  Total users in database: ${users.length} (showing last 20)`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await closeDB();
  }
}

// Run the check
checkRecentUsers();
