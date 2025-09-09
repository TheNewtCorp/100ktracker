const { db } = require('./db');

async function addStripeContactColumns() {
  try {
    console.log('Adding Stripe integration columns to user_contacts table...');

    // Add stripe_customer_id column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE user_contacts ADD COLUMN stripe_customer_id TEXT', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Add stripe_payment_methods column (JSON text to store multiple payment methods)
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE user_contacts ADD COLUMN stripe_payment_methods TEXT', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Add stripe_default_payment_method column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE user_contacts ADD COLUMN stripe_default_payment_method TEXT', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Add last_stripe_sync column
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE user_contacts ADD COLUMN last_stripe_sync DATETIME', (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log('Successfully added Stripe columns to user_contacts table');

    // Verify the columns were added
    db.all('PRAGMA table_info(user_contacts)', (err, rows) => {
      if (err) {
        console.error('Error checking table structure:', err);
      } else {
        console.log('Updated user_contacts table structure:');
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

addStripeContactColumns();
