// Database migration to add user management fields
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'users.sqlite');
const db = new sqlite3.Database(dbPath);

async function addUserManagementColumns() {
  try {
    console.log('Adding user management columns...');

    // Add invited_by column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN invited_by INTEGER REFERENCES users(id)', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ Added invited_by column');
          resolve();
        }
      });
    });

    // Add invitation_sent_at column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN invitation_sent_at DATETIME', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ Added invitation_sent_at column');
          resolve();
        }
      });
    });

    // Add first_login_at column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN first_login_at DATETIME', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ Added first_login_at column');
          resolve();
        }
      });
    });

    // Add status column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "active"', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ Added status column');
          resolve();
        }
      });
    });

    // Add temporary_password column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN temporary_password INTEGER DEFAULT 0', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ Added temporary_password column');
          resolve();
        }
      });
    });

    // Update admin user to have proper status
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET status = "active", temporary_password = 0 WHERE username = "admin"', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✓ Updated admin user status');
          resolve();
        }
      });
    });

    // Create index for better performance
    await new Promise((resolve, reject) => {
      db.run('CREATE INDEX IF NOT EXISTS idx_users_status ON users (status)', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✓ Created status index');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run('CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users (invited_by)', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✓ Created invited_by index');
          resolve();
        }
      });
    });

    console.log('\n✅ User management migration completed successfully!');

    // Show updated table structure
    db.all('PRAGMA table_info(users)', (err, rows) => {
      if (err) {
        console.error('Error checking table structure:', err);
      } else {
        console.log('\n📋 Updated users table structure:');
        rows.forEach((row) => {
          console.log(
            `   ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`,
          );
        });
      }
      db.close();
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addUserManagementColumns();
}

module.exports = { addUserManagementColumns };
