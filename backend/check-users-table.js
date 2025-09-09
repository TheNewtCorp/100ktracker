const { db } = require('./db');

db.all('PRAGMA table_info(users)', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Users table structure:');
    rows.forEach((row) => {
      console.log(`${row.cid}: ${row.name} (${row.type})`);
    });
  }
  db.close();
});
