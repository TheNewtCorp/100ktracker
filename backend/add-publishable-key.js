const { db } = require('./db');

console.log('Adding stripe_publishable_key column...');

db.run('ALTER TABLE users ADD COLUMN stripe_publishable_key TEXT', (err) => {
  if (err) {
    console.error('Error adding column:', err.message);
  } else {
    console.log('Successfully added stripe_publishable_key column');
  }

  // Check the updated structure
  db.all('PRAGMA table_info(users)', (err, rows) => {
    if (err) {
      console.error('Error checking table:', err);
    } else {
      console.log('\nUpdated table structure:');
      rows.forEach((row) => {
        console.log(`${row.cid}: ${row.name} (${row.type})`);
      });
    }
    db.close();
  });
});
