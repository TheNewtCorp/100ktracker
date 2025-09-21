#!/usr/bin/env node

/**
 * Production JWT Token Analysis Script
 *
 * This script analyzes JWT token existence for all users in the production database.
 * Run with: node analyze-jwt-tokens.js
 *
 * It will show:
 * - Which users have JWT tokens (have logged in)
 * - Which users don't have JWT tokens (never logged in)
 * - JWT adoption rates and statistics
 * - Detailed JWT tracking data if migration was run
 */

const { getDb, ensureDbConnection } = require('./db');

function analyzeJWTTokens() {
  console.log('🎯 Production JWT Token Analysis');
  console.log('📡 Environment:', process.env.NODE_ENV || 'development');
  console.log('📅 Analysis Date:', new Date().toISOString());
  console.log('='.repeat(60));
  console.log('');

  try {
    // Ensure database connection
    ensureDbConnection();
    const db = getDb();

    if (!db) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    console.log('✅ Database connected successfully');
    console.log('');

    // Check table structure first
    console.log('📋 Analyzing database structure...');
    db.all('PRAGMA table_info(users)', (err, columns) => {
      if (err) {
        console.error('❌ Failed to get table info:', err.message);
        process.exit(1);
      }

      console.log('📊 Available columns in users table:');
      columns.forEach((col) => {
        console.log(`   • ${col.name} (${col.type})`);
      });
      console.log('');

      const hasJWTTracking = columns.some((col) => col.name === 'last_jwt_issued');

      // Query all users
      console.log('👥 Fetching all users...');
      db.all('SELECT id, username, email, status, created_at FROM users ORDER BY id', (err, users) => {
        if (err) {
          console.error('❌ Query failed:', err.message);
          process.exit(1);
        }

        console.log(`📈 Found ${users.length} users in database`);
        console.log('');

        // Display all users with JWT status
        console.log('🔍 Individual User JWT Token Status:');
        console.log('='.repeat(50));

        users.forEach((user) => {
          let jwtStatus, statusIcon;

          if (user.status === 'active') {
            jwtStatus = 'HAS JWT TOKEN (logged in)';
            statusIcon = '✅';
          } else if (user.status === 'pending') {
            jwtStatus = 'NO JWT TOKEN (registered, never logged in)';
            statusIcon = '⏳';
          } else if (user.status === 'invited') {
            jwtStatus = 'NO JWT TOKEN (email sent, not registered)';
            statusIcon = '📧';
          } else {
            jwtStatus = `Unknown status: ${user.status}`;
            statusIcon = '❓';
          }

          console.log(`   ${statusIcon} ${user.id}. ${user.username}`);
          console.log(`      📧 Email: ${user.email || 'None'}`);
          console.log(`      🔑 JWT Status: ${jwtStatus}`);
          console.log(`      📅 Created: ${user.created_at}`);
          console.log('');
        });

        // Generate summary statistics
        console.log('📊 JWT Token Summary Statistics:');
        console.log('='.repeat(40));

        const statusCounts = {};
        users.forEach((user) => {
          statusCounts[user.status] = (statusCounts[user.status] || 0) + 1;
        });

        Object.entries(statusCounts).forEach(([status, count]) => {
          let description;
          if (status === 'active') {
            description = 'Users WITH JWT tokens (successfully logged in)';
          } else if (status === 'pending') {
            description = 'Users WITHOUT JWT tokens (registered but never logged in)';
          } else if (status === 'invited') {
            description = 'Users WITHOUT JWT tokens (invitation sent, not registered)';
          } else {
            description = `Users with status: ${status}`;
          }

          console.log(`   📈 ${status}: ${count} users - ${description}`);
        });

        // Calculate key metrics
        const activeUsers = statusCounts.active || 0;
        const pendingUsers = statusCounts.pending || 0;
        const invitedUsers = statusCounts.invited || 0;
        const totalUsers = users.length;

        const jwtAdoptionRate = ((activeUsers / totalUsers) * 100).toFixed(1);
        const registrationRate = (((activeUsers + pendingUsers) / totalUsers) * 100).toFixed(1);
        const loginConversionRate =
          totalUsers > 0 ? ((activeUsers / (activeUsers + pendingUsers)) * 100).toFixed(1) : 0;

        console.log('');
        console.log('🎯 Key Metrics:');
        console.log(`   • Total Users: ${totalUsers}`);
        console.log(`   • Users WITH JWT Tokens: ${activeUsers} (${jwtAdoptionRate}%)`);
        console.log(
          `   • Users WITHOUT JWT Tokens: ${totalUsers - activeUsers} (${(100 - jwtAdoptionRate).toFixed(1)}%)`,
        );
        console.log(`   • Registration Rate: ${registrationRate}%`);
        console.log(`   • Login Conversion Rate: ${loginConversionRate}%`);

        // Performance assessment
        console.log('');
        console.log('🏆 Performance Assessment:');
        if (jwtAdoptionRate >= 90) {
          console.log('   🎉 EXCELLENT! Almost all users are logging in and using JWT tokens');
        } else if (jwtAdoptionRate >= 70) {
          console.log('   ✅ GOOD! Most users are logging in and getting JWT tokens');
        } else if (jwtAdoptionRate >= 50) {
          console.log('   ⚠️  MODERATE: About half of users are logging in');
        } else {
          console.log('   🔴 NEEDS ATTENTION: Low login rate - many users not getting JWT tokens');
        }

        // Check for detailed JWT tracking if available
        if (hasJWTTracking) {
          console.log('');
          console.log('🔍 Detailed JWT Tracking Data Available:');
          console.log('='.repeat(45));

          db.all(
            `
            SELECT 
              username, 
              last_jwt_issued, 
              login_count, 
              first_login_date, 
              last_login_date 
            FROM users 
            WHERE last_jwt_issued IS NOT NULL 
            ORDER BY last_jwt_issued DESC
          `,
            (err, jwtData) => {
              if (err) {
                console.log('   ⚠️  Error querying JWT tracking data:', err.message);
              } else if (jwtData.length > 0) {
                console.log('🔑 Recent JWT Token Activity:');
                jwtData.slice(0, 10).forEach((user) => {
                  // Show top 10 most recent
                  console.log(`   • ${user.username}:`);
                  console.log(`     🔑 Last JWT Issued: ${user.last_jwt_issued}`);
                  console.log(`     📊 Total Logins: ${user.login_count}`);
                  console.log(`     🎯 First Login: ${user.first_login_date || 'Unknown'}`);
                  console.log(`     ⏰ Last Login: ${user.last_login_date || 'Unknown'}`);
                  console.log('');
                });

                if (jwtData.length > 10) {
                  console.log(`   ... and ${jwtData.length - 10} more users with JWT activity`);
                }
              } else {
                console.log('   ℹ️  JWT tracking columns exist but no JWT activity data found');
              }

              finishAnalysis();
            },
          );
        } else {
          console.log('');
          console.log('ℹ️  JWT Tracking Migration Status:');
          console.log('   📋 Detailed JWT tracking columns not found');
          console.log('   🔧 Run database migration to enable detailed JWT activity tracking');
          console.log('   📊 Current analysis based on user status (sufficient for JWT existence check)');

          finishAnalysis();
        }
      });
    });
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

function finishAnalysis() {
  console.log('');
  console.log('✅ JWT Token Analysis Complete');
  console.log('📅 Completed at:', new Date().toISOString());
  console.log('='.repeat(60));

  process.exit(0);
}

// Run the analysis
console.log('🚀 Starting JWT Token Analysis...');
analyzeJWTTokens();
