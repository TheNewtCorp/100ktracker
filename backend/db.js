// Simple SQLite user database setup and query functions
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Database connection variable (initialized later)
let db = null;

// Use environment variable for database path, or default for development
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'db', 'users.sqlite');

// Create users table if not exists
function initDB() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Initializing database...');
      console.log(`Using database path: ${dbPath}`);

      // Ensure database directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        console.log(`Creating database directory: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Create database connection only when needed
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
          return;
        }
        console.log('Connected to SQLite database');

        // Create users table
        createUserTable().then(resolve).catch(reject);
      });
    } catch (error) {
      console.error('Database initialization failed:', error);
      reject(error);
    }
  });
}

function createUserTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
      (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
          reject(err);
          return;
        }
        console.log('Users table created/verified');

        // Insert default admin user if not exists
        db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
          if (err) {
            console.error('Error checking for admin user:', err.message);
            reject(err);
            return;
          }

          if (!user) {
            console.log('Creating default admin user...');
            const hashed = bcrypt.hashSync('password', 10);
            db.run(
              'INSERT INTO users (username, hashed_password, email) VALUES (?, ?, ?)',
              ['admin', hashed, 'admin@example.com'],
              (err) => {
                if (err) {
                  console.error('Error creating admin user:', err.message);
                  reject(err);
                } else {
                  console.log('Default admin user created');
                  resolve();
                }
              },
            );
          } else {
            console.log('Admin user already exists');
            resolve();
          }
        });
      },
    );
  });
}

// Add a new user (registration)
function addUser(username, password, email, callback) {
  const hashed = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, hashed_password, email) VALUES (?, ?, ?)', [username, hashed, email], callback);
}

// Find user by username
function findUser(username, callback) {
  db.get('SELECT * FROM users WHERE username = ?', [username], callback);
}

// Verify password
function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.hashed_password);
}

// User-specific data functions

// Watches
function getUserWatches(userId, callback) {
  db.all('SELECT * FROM user_watches WHERE user_id = ? ORDER BY in_date DESC', [userId], callback);
}

function createUserWatch(userId, watchData, callback) {
  const {
    brand,
    model,
    reference_number,
    in_date,
    serial_number,
    watch_set,
    platform_purchased,
    purchase_price,
    liquidation_price,
    accessories,
    accessories_cost,
    date_sold,
    platform_sold,
    price_sold,
    fees,
    shipping,
    taxes,
    notes,
    buyer_contact_id,
    seller_contact_id,
  } = watchData;

  db.run(
    `INSERT INTO user_watches 
    (user_id, brand, model, reference_number, in_date, serial_number, watch_set, platform_purchased, 
     purchase_price, liquidation_price, accessories, accessories_cost, date_sold, platform_sold, 
     price_sold, fees, shipping, taxes, notes, buyer_contact_id, seller_contact_id, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      userId,
      brand,
      model,
      reference_number,
      in_date,
      serial_number,
      watch_set,
      platform_purchased,
      purchase_price,
      liquidation_price,
      accessories,
      accessories_cost,
      date_sold,
      platform_sold,
      price_sold,
      fees,
      shipping,
      taxes,
      notes,
      buyer_contact_id,
      seller_contact_id,
    ],
    callback,
  );
}

function updateUserWatch(userId, watchId, watchData, callback) {
  const {
    brand,
    model,
    reference_number,
    in_date,
    serial_number,
    watch_set,
    platform_purchased,
    purchase_price,
    liquidation_price,
    accessories,
    accessories_cost,
    date_sold,
    platform_sold,
    price_sold,
    fees,
    shipping,
    taxes,
    notes,
    buyer_contact_id,
    seller_contact_id,
  } = watchData;

  db.run(
    `UPDATE user_watches SET 
    brand = ?, model = ?, reference_number = ?, in_date = ?, serial_number = ?, watch_set = ?, 
    platform_purchased = ?, purchase_price = ?, liquidation_price = ?, accessories = ?, 
    accessories_cost = ?, date_sold = ?, platform_sold = ?, price_sold = ?, fees = ?, 
    shipping = ?, taxes = ?, notes = ?, buyer_contact_id = ?, seller_contact_id = ?, 
    updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND user_id = ?`,
    [
      brand,
      model,
      reference_number,
      in_date,
      serial_number,
      watch_set,
      platform_purchased,
      purchase_price,
      liquidation_price,
      accessories,
      accessories_cost,
      date_sold,
      platform_sold,
      price_sold,
      fees,
      shipping,
      taxes,
      notes,
      buyer_contact_id,
      seller_contact_id,
      watchId,
      userId,
    ],
    callback,
  );
}

function deleteUserWatch(userId, watchId, callback) {
  db.run('DELETE FROM user_watches WHERE id = ? AND user_id = ?', [watchId, userId], callback);
}

function bulkDeleteUserWatches(userId, watchIds, callback) {
  if (!Array.isArray(watchIds) || watchIds.length === 0) {
    return callback(new Error('Watch IDs must be a non-empty array'));
  }

  console.log('bulkDeleteUserWatches called with:', { userId, watchIds });

  // Create placeholders for the IN clause
  const placeholders = watchIds.map(() => '?').join(',');
  const query = `DELETE FROM user_watches WHERE id IN (${placeholders}) AND user_id = ?`;

  // Parameters: all watchIds + userId at the end
  const params = [...watchIds, userId];

  console.log('Executing query:', query);
  console.log('With parameters:', params);

  db.run(query, params, callback);
}

// Contacts
function getUserContacts(userId, callback) {
  db.all('SELECT * FROM user_contacts WHERE user_id = ? ORDER BY first_name, last_name', [userId], callback);
}

function createUserContact(userId, contactData, callback) {
  const {
    first_name,
    last_name,
    email,
    phone,
    contact_source,
    contact_type,
    business_name,
    street_address,
    city,
    state,
    postal_code,
    website,
    time_zone,
    notes,
  } = contactData;

  db.run(
    `INSERT INTO user_contacts 
    (user_id, first_name, last_name, email, phone, contact_source, contact_type, business_name, 
     street_address, city, state, postal_code, website, time_zone, notes, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      userId,
      first_name,
      last_name,
      email,
      phone,
      contact_source,
      contact_type,
      business_name,
      street_address,
      city,
      state,
      postal_code,
      website,
      time_zone,
      notes,
    ],
    callback,
  );
}

function updateUserContact(userId, contactId, contactData, callback) {
  const {
    first_name,
    last_name,
    email,
    phone,
    contact_source,
    contact_type,
    business_name,
    street_address,
    city,
    state,
    postal_code,
    website,
    time_zone,
    notes,
  } = contactData;

  db.run(
    `UPDATE user_contacts SET 
    first_name = ?, last_name = ?, email = ?, phone = ?, contact_source = ?, contact_type = ?, 
    business_name = ?, street_address = ?, city = ?, state = ?, postal_code = ?, website = ?, 
    time_zone = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND user_id = ?`,
    [
      first_name,
      last_name,
      email,
      phone,
      contact_source,
      contact_type,
      business_name,
      street_address,
      city,
      state,
      postal_code,
      website,
      time_zone,
      notes,
      contactId,
      userId,
    ],
    callback,
  );
}

function deleteUserContact(userId, contactId, callback) {
  db.run('DELETE FROM user_contacts WHERE id = ? AND user_id = ?', [contactId, userId], callback);
}

// Leads
function getUserLeads(userId, callback) {
  db.all('SELECT * FROM user_leads WHERE user_id = ? ORDER BY created_at DESC', [userId], callback);
}

function createUserLead(userId, leadData, callback) {
  const { title, status, contact_id, watch_reference, notes, reminder_date } = leadData;

  db.run(
    `INSERT INTO user_leads 
    (user_id, title, status, contact_id, watch_reference, notes, reminder_date, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [userId, title, status, contact_id, watch_reference, notes, reminder_date],
    callback,
  );
}

function updateUserLead(userId, leadId, leadData, callback) {
  const { title, status, contact_id, watch_reference, notes, reminder_date } = leadData;

  db.run(
    `UPDATE user_leads SET 
    title = ?, status = ?, contact_id = ?, watch_reference = ?, notes = ?, reminder_date = ?, 
    updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND user_id = ?`,
    [title, status, contact_id, watch_reference, notes, reminder_date, leadId, userId],
    callback,
  );
}

function deleteUserLead(userId, leadId, callback) {
  db.run('DELETE FROM user_leads WHERE id = ? AND user_id = ?', [leadId, userId], callback);
}

// Cards
function getUserCards(userId, contactId, callback) {
  if (contactId) {
    db.all('SELECT * FROM user_cards WHERE user_id = ? AND contact_id = ?', [userId, contactId], callback);
  } else {
    db.all('SELECT * FROM user_cards WHERE user_id = ?', [userId], callback);
  }
}

function createUserCard(userId, cardData, callback) {
  const { contact_id, cardholder_name, last4, expiry_month, expiry_year } = cardData;

  db.run(
    `INSERT INTO user_cards 
    (user_id, contact_id, cardholder_name, last4, expiry_month, expiry_year, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [userId, contact_id, cardholder_name, last4, expiry_month, expiry_year],
    callback,
  );
}

function deleteUserCard(userId, cardId, callback) {
  db.run('DELETE FROM user_cards WHERE id = ? AND user_id = ?', [cardId, userId], callback);
}

module.exports = {
  db,
  initDB,
  addUser,
  findUser,
  verifyPassword,
  // Watches
  getUserWatches,
  createUserWatch,
  updateUserWatch,
  deleteUserWatch,
  bulkDeleteUserWatches,
  // Contacts
  getUserContacts,
  createUserContact,
  updateUserContact,
  deleteUserContact,
  // Leads
  getUserLeads,
  createUserLead,
  updateUserLead,
  deleteUserLead,
  // Cards
  getUserCards,
  createUserCard,
  deleteUserCard,
};
