#!/usr/bin/env node

/**
 * Migration: Add temporary_password column to users table
 * This column tracks if a user's password is temporary and must be changed on next login
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function addTemporaryPasswordColumn() {
  return new Promise((resolve, reject) => {
    // Use the same database path as the main application
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'db', 'users.sqlite');
    console.log(`Connecting to database: ${dbPath}`);

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`Failed to connect to database: ${err.message}`));
        return;
      }

      console.log('Connected to SQLite database');

      // First, check if the column already exists
      db.all('PRAGMA table_info(users)', (err, columns) => {
        if (err) {
          db.close();
          reject(new Error(`Failed to get table info: ${err.message}`));
          return;
        }

        // Check if temporary_password column already exists
        const hasTemporaryPassword = columns.some((col) => col.name === 'temporary_password');

        if (hasTemporaryPassword) {
          console.log('✓ temporary_password column already exists');
          db.close();
          resolve();
          return;
        }

        // Add the temporary_password column
        db.run('ALTER TABLE users ADD COLUMN temporary_password INTEGER DEFAULT 0', (err) => {
          if (err) {
            db.close();
            reject(new Error(`Failed to add temporary_password column: ${err.message}`));
            return;
          }

          console.log('✓ Added temporary_password column to users table');

          // Verify the column was added
          db.all('PRAGMA table_info(users)', (err, newColumns) => {
            db.close();

            if (err) {
              reject(new Error(`Failed to verify column addition: ${err.message}`));
              return;
            }

            const hasNewColumn = newColumns.some((col) => col.name === 'temporary_password');
            if (hasNewColumn) {
              console.log('✅ Migration completed successfully!');
              console.log(`Total columns in users table: ${newColumns.length}`);
              resolve();
            } else {
              reject(new Error('Column was not added successfully'));
            }
          });
        });
      });
    });
  });
}

// Main execution
async function main() {
  try {
    console.log('🔄 Starting temporary_password column migration...\n');
    await addTemporaryPasswordColumn();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { addTemporaryPasswordColumn };
