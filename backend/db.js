// Simple SQLite user database setup and query functions
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Database connection variable (initialized later)
let db = null;

// getter function for db
function getDb() {
  return db;
}

// Ensure database connection is available
function ensureDbConnection() {
  if (!db) {
    throw new Error('Database connection not available');
  }
  return true;
}

// Create users table if not exists
function initDB() {
  return new Promise((resolve, reject) => {
    try {
      // Resolve database path at runtime when environment variables are available
      const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'db', 'users.sqlite');

      console.log('Initializing database...');
      console.log(`Using database path: ${dbPath}`);
      console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

      // Ensure database directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        console.log(`Creating database directory: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Check if database file already exists (persistence check)
      const dbExists = fs.existsSync(dbPath);
      console.log(`Database file exists: ${dbExists}`);

      if (dbExists) {
        const stats = fs.statSync(dbPath);
        console.log(`Existing database size: ${stats.size} bytes`);
        console.log(`Last modified: ${stats.mtime}`);
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
        createUserTable()
          .then(() => {
            // After users table is created, create all other tables
            return createAllTables();
          })
          .then(resolve)
          .catch(reject);
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
      first_login_at DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      stripe_secret_key TEXT,
      stripe_publishable_key TEXT
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
                  // Run migration to add Stripe columns if they don't exist
                  migrateStripeColumns()
                    .then(() => {
                      resolve();
                    })
                    .catch((migrationErr) => {
                      console.error('Error during Stripe columns migration:', migrationErr.message);
                      reject(migrationErr);
                    });
                }
              },
            );
          } else {
            console.log('Admin user already exists');
            // Run migration to add Stripe columns if they don't exist
            migrateStripeColumns()
              .then(() => {
                resolve();
              })
              .catch((migrationErr) => {
                console.error('Error during Stripe columns migration:', migrationErr.message);
                reject(migrationErr);
              });
          }
        });
      },
    );
  });
}

// Migrate existing databases to add Stripe columns if they don't exist
function migrateStripeColumns() {
  return new Promise((resolve, reject) => {
    // Check if stripe_secret_key column exists
    db.get('PRAGMA table_info(users)', (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      // Get all column information
      db.all('PRAGMA table_info(users)', (err, columns) => {
        if (err) {
          reject(err);
          return;
        }

        const hasStripeSecretKey = columns.some((col) => col.name === 'stripe_secret_key');
        const hasStripePublishableKey = columns.some((col) => col.name === 'stripe_publishable_key');

        const migrations = [];

        if (!hasStripeSecretKey) {
          migrations.push(
            new Promise((resolveCol, rejectCol) => {
              db.run('ALTER TABLE users ADD COLUMN stripe_secret_key TEXT', (err) => {
                if (err) {
                  console.error('Error adding stripe_secret_key column:', err.message);
                  rejectCol(err);
                } else {
                  console.log('Added stripe_secret_key column to users table');
                  resolveCol();
                }
              });
            }),
          );
        }

        if (!hasStripePublishableKey) {
          migrations.push(
            new Promise((resolveCol, rejectCol) => {
              db.run('ALTER TABLE users ADD COLUMN stripe_publishable_key TEXT', (err) => {
                if (err) {
                  console.error('Error adding stripe_publishable_key column:', err.message);
                  rejectCol(err);
                } else {
                  console.log('Added stripe_publishable_key column to users table');
                  resolveCol();
                }
              });
            }),
          );
        }

        if (migrations.length === 0) {
          console.log('Stripe columns already exist in users table');
          resolve();
        } else {
          Promise.all(migrations)
            .then(() => {
              console.log('Stripe columns migration completed successfully');
              resolve();
            })
            .catch(reject);
        }
      });
    });
  });
}

// Create all application tables
function createAllTables() {
  return Promise.all([
    createUserWatchesTable(),
    createUserContactsTable(),
    createUserLeadsTable(),
    createUserCardsTable(),
    createUserInvoicesTable(),
    createUserInvoiceItemsTable(),
  ]);
}

function createUserWatchesTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS user_watches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      reference_number TEXT NOT NULL,
      in_date TEXT, -- YYYY-MM-DD
      serial_number TEXT,
      watch_set TEXT, -- WatchOnly, WatchAndBox, WatchAndPapers, FullSet
      platform_purchased TEXT,
      purchase_price REAL,
      liquidation_price REAL,
      accessories TEXT,
      accessories_cost REAL DEFAULT 0,
      date_sold TEXT, -- YYYY-MM-DD
      platform_sold TEXT,
      price_sold REAL,
      fees REAL DEFAULT 0,
      shipping REAL DEFAULT 0,
      taxes REAL DEFAULT 0,
      notes TEXT,
      buyer_contact_id INTEGER,
      seller_contact_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_contact_id) REFERENCES user_contacts (id) ON DELETE SET NULL,
      FOREIGN KEY (seller_contact_id) REFERENCES user_contacts (id) ON DELETE SET NULL
    )`,
      (err) => {
        if (err) {
          console.error('Error creating user_watches table:', err.message);
          reject(err);
        } else {
          console.log('user_watches table created/verified');
          resolve();
        }
      },
    );
  });
}

function createUserContactsTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS user_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      contact_source TEXT,
      contact_type TEXT, -- Lead, Customer, WatchTrader, Jeweler
      business_name TEXT,
      street_address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      website TEXT,
      time_zone TEXT,
      notes TEXT,
      stripe_customer_id TEXT, -- Stripe customer ID for invoicing
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
      (err) => {
        if (err) {
          console.error('Error creating user_contacts table:', err.message);
          reject(err);
        } else {
          console.log('user_contacts table created/verified');
          resolve();
        }
      },
    );
  });
}

function createUserLeadsTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS user_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL, -- Monitoring, Contacted, Negotiating, etc.
      contact_id INTEGER,
      watch_reference TEXT,
      notes TEXT,
      reminder_date TEXT, -- YYYY-MM-DD
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES user_contacts (id) ON DELETE SET NULL
    )`,
      (err) => {
        if (err) {
          console.error('Error creating user_leads table:', err.message);
          reject(err);
        } else {
          console.log('user_leads table created/verified');
          resolve();
        }
      },
    );
  });
}

function createUserCardsTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS user_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      cardholder_name TEXT NOT NULL,
      last4 TEXT NOT NULL,
      expiry_month TEXT NOT NULL,
      expiry_year TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES user_contacts (id) ON DELETE CASCADE
    )`,
      (err) => {
        if (err) {
          console.error('Error creating user_cards table:', err.message);
          reject(err);
        } else {
          console.log('user_cards table created/verified');
          resolve();
        }
      },
    );
  });
}

function createUserInvoicesTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS user_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stripe_invoice_id TEXT UNIQUE NOT NULL,
      contact_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', -- draft, open, paid, void, uncollectible
      total_amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'usd',
      due_date TEXT, -- YYYY-MM-DD
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES user_contacts (id) ON DELETE CASCADE
    )`,
      (err) => {
        if (err) {
          console.error('Error creating user_invoices table:', err.message);
          reject(err);
        } else {
          console.log('user_invoices table created/verified');
          resolve();
        }
      },
    );
  });
}

function createUserInvoiceItemsTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS user_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      invoice_id INTEGER NOT NULL,
      watch_id INTEGER,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES user_invoices (id) ON DELETE CASCADE,
      FOREIGN KEY (watch_id) REFERENCES user_watches (id) ON DELETE SET NULL
    )`,
      (err) => {
        if (err) {
          console.error('Error creating user_invoice_items table:', err.message);
          reject(err);
        } else {
          console.log('user_invoice_items table created/verified');
          resolve();
        }
      },
    );
  });
}

// Add a new user (registration)
function addUser(username, password, email, callback) {
  const hashed = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, hashed_password, email) VALUES (?, ?, ?)', [username, hashed, email], callback);
}

// Add enhanced user with additional fields (backward compatible)
function addEnhancedUser(username, password, email, invitedBy = 1, callback) {
  const hashed = bcrypt.hashSync(password, 10);

  // Use only the columns that exist in the current schema
  const query = `
    INSERT INTO users (
      username, 
      hashed_password, 
      email, 
      status
    ) VALUES (?, ?, ?, ?)
  `;

  const values = [username, hashed, email, 'pending'];

  db.run(query, values, callback);
}

// Find user by username
function findUser(username, callback) {
  try {
    ensureDbConnection();
    db.get('SELECT * FROM users WHERE username = ?', [username], callback);
  } catch (error) {
    console.error('Database connection error in findUser:', error.message);
    callback(error);
  }
}

// Find user by email
function findUserByEmail(email, callback) {
  db.get('SELECT * FROM users WHERE email = ?', [email], callback);
}

// Verify password
function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.hashed_password);
}

// User-specific data functions

// Watches
function getUserWatches(userId, callback) {
  try {
    ensureDbConnection();
    db.all('SELECT * FROM user_watches WHERE user_id = ? ORDER BY in_date DESC', [userId], callback);
  } catch (error) {
    console.error('Database connection error in getUserWatches:', error.message);
    callback(error);
  }
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
  try {
    ensureDbConnection();
    db.all('SELECT * FROM user_contacts WHERE user_id = ? ORDER BY first_name, last_name', [userId], callback);
  } catch (error) {
    console.error('Database connection error in getUserContacts:', error.message);
    callback(error);
  }
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

// Helper functions for user login updates
function updateFirstLoginTimestamp(userId, callback = () => {}) {
  if (db) {
    db.run('UPDATE users SET first_login_at = CURRENT_TIMESTAMP WHERE id = ?', [userId], callback);
  }
}

function updateUserStatus(userId, status, callback = () => {}) {
  if (db) {
    db.run('UPDATE users SET status = ? WHERE id = ?', [status, userId], callback);
  }
}

function updateInvitationTimestamp(userId, callback = () => {}) {
  // This function is safe to call even if invitation_sent_at column doesn't exist
  // It will silently fail without breaking the application
  if (db) {
    db.run('UPDATE users SET status = ? WHERE id = ?', ['invited', userId], (err) => {
      // Ignore column doesn't exist errors for backward compatibility
      if (err && !err.message.includes('no such column')) {
        callback(err);
      } else {
        callback();
      }
    });
  }
}

// Update username helper function
function updateUsername(oldUsername, newUsername, callback = () => {}) {
  if (db) {
    db.run('UPDATE users SET username = ? WHERE username = ?', [newUsername, oldUsername], callback);
  }
}

// Database cleanup function
function closeDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  db,
  getDb,
  initDB,
  closeDB,
  ensureDbConnection,
  addUser,
  addEnhancedUser,
  findUser,
  findUserByEmail,
  verifyPassword,
  updateFirstLoginTimestamp,
  updateUserStatus,
  updateInvitationTimestamp,
  updateUsername,
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
