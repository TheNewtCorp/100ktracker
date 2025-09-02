const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'db', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function checkDatabase() {
  console.log('=== DATABASE ANALYSIS ===\n');
  
  // Check users
  console.log('USERS:');
  db.all('SELECT id, username, email, created_at FROM users ORDER BY id', (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return;
    }
    
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Created: ${user.created_at}`);
    });
    console.log(`Total users: ${users.length}\n`);
    
    // Check data for each user
    users.forEach(user => {
      console.log(`=== DATA FOR USER: ${user.username} (ID: ${user.id}) ===`);
      
      // Watches
      db.all('SELECT COUNT(*) as count FROM user_watches WHERE user_id = ?', [user.id], (err, watchCount) => {
        if (!err && watchCount[0]) {
          console.log(`Watches: ${watchCount[0].count}`);
          
          if (watchCount[0].count > 0) {
            db.all('SELECT brand, model, reference_number FROM user_watches WHERE user_id = ? LIMIT 3', [user.id], (err, watches) => {
              if (!err) {
                watches.forEach(watch => console.log(`  - ${watch.brand} ${watch.model} (${watch.reference_number})`));
              }
            });
          }
        }
      });
      
      // Contacts
      db.all('SELECT COUNT(*) as count FROM user_contacts WHERE user_id = ?', [user.id], (err, contactCount) => {
        if (!err && contactCount[0]) {
          console.log(`Contacts: ${contactCount[0].count}`);
          
          if (contactCount[0].count > 0) {
            db.all('SELECT first_name, last_name, contact_type FROM user_contacts WHERE user_id = ? LIMIT 3', [user.id], (err, contacts) => {
              if (!err) {
                contacts.forEach(contact => console.log(`  - ${contact.first_name} ${contact.last_name} (${contact.contact_type})`));
              }
            });
          }
        }
      });
      
      // Leads
      db.all('SELECT COUNT(*) as count FROM user_leads WHERE user_id = ?', [user.id], (err, leadCount) => {
        if (!err && leadCount[0]) {
          console.log(`Leads: ${leadCount[0].count}`);
          
          if (leadCount[0].count > 0) {
            db.all('SELECT title, status FROM user_leads WHERE user_id = ? LIMIT 3', [user.id], (err, leads) => {
              if (!err) {
                leads.forEach(lead => console.log(`  - ${lead.title} (${lead.status})`));
              }
            });
          }
        }
      });
      
      console.log(''); // Empty line between users
    });
  });
}

// Wait a moment for all queries to complete
setTimeout(() => {
  db.close();
}, 2000);

checkDatabase();
