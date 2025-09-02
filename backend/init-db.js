const { initDB } = require('./db');

console.log('Initializing database...');
initDB();

// Wait a moment for the initialization to complete
setTimeout(() => {
  console.log('Database initialization complete');
  process.exit(0);
}, 1000);
