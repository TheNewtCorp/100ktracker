const { db } = require('./db');

async function addStripeColumns() {
  try {
    console.log('Adding Stripe configuration columns to users table...');

    // Add stripe_secret_key column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN stripe_secret_key TEXT', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Add stripe_publishable_key column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN stripe_publishable_key TEXT', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log('Successfully added Stripe columns to users table');

    // Verify the columns were added
    db.all('PRAGMA table_info(users)', (err, rows) => {
      if (err) {
        console.error('Error checking table structure:', err);
      } else {
        console.log('Updated users table structure:');
        rows.forEach((row) => {
          console.log(`- ${row.name}: ${row.type}`);
        });
      }
      db.close();
    });
  } catch (error) {
    console.error('Error adding Stripe columns:', error);
    db.close();
  }
}

addStripeColumns();
