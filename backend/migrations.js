// Database migration script for user-specific tables
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'users.sqlite');
const db = new sqlite3.Database(dbPath);

// Migration functions
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
        if (err) reject(err);
        else resolve();
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
        if (err) reject(err);
        else resolve();
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
        if (err) reject(err);
        else resolve();
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
        if (err) reject(err);
        else resolve();
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
        if (err) reject(err);
        else resolve();
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
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

function createIndexes() {
  return new Promise((resolve, reject) => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_watches_user_id ON user_watches (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_watches_brand_model ON user_watches (brand, model)',
      'CREATE INDEX IF NOT EXISTS idx_user_watches_in_date ON user_watches (in_date)',
      'CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id ON user_contacts (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_contacts_name ON user_contacts (first_name, last_name)',
      'CREATE INDEX IF NOT EXISTS idx_user_contacts_type ON user_contacts (contact_type)',
      'CREATE INDEX IF NOT EXISTS idx_user_leads_user_id ON user_leads (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_leads_status ON user_leads (status)',
      'CREATE INDEX IF NOT EXISTS idx_user_leads_reminder ON user_leads (reminder_date)',
      'CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_cards_contact_id ON user_cards (contact_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_invoices_user_id ON user_invoices (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_invoices_contact_id ON user_invoices (contact_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_invoices_status ON user_invoices (status)',
      'CREATE INDEX IF NOT EXISTS idx_user_invoices_stripe_id ON user_invoices (stripe_invoice_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_invoice_items_user_id ON user_invoice_items (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_invoice_items_invoice_id ON user_invoice_items (invoice_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_invoice_items_watch_id ON user_invoice_items (watch_id)',
    ];

    let completed = 0;
    indexes.forEach((indexSql) => {
      db.run(indexSql, (err) => {
        if (err) reject(err);
        completed++;
        if (completed === indexes.length) resolve();
      });
    });
  });
}

// Seed data based on existing mock data structure
function seedMockData() {
  return new Promise(async (resolve, reject) => {
    try {
      // Get admin user ID
      db.get('SELECT id FROM users WHERE username = ?', ['admin'], async (err, user) => {
        if (err || !user) {
          reject(new Error('Admin user not found'));
          return;
        }

        const userId = user.id;

        // Seed contacts first (needed for foreign keys)
        const contacts = [
          [
            userId,
            'John',
            'Doe',
            'john.d@example.com',
            '123-456-7890',
            null,
            'Customer',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ],
          [
            userId,
            'Jane',
            'Smith',
            'jane@smithjewelers.com',
            null,
            null,
            'Jeweler',
            'Smith Jewelers',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ],
        ];

        const contactInsert =
          'INSERT INTO user_contacts (user_id, first_name, last_name, email, phone, contact_source, contact_type, business_name, street_address, city, state, postal_code, website, time_zone, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        for (const contact of contacts) {
          await new Promise((resolve, reject) => {
            db.run(contactInsert, contact, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Seed watches
        const watches = [
          [
            userId,
            'Rolex',
            'Submariner',
            '126610LN',
            '2023-05-15',
            null,
            'FullSet',
            null,
            13500,
            null,
            null,
            150,
            '2023-09-20',
            null,
            15500,
            450,
            100,
            0,
            null,
            null,
            2,
          ],
          [
            userId,
            'Omega',
            'Speedmaster',
            '310.30.42.50.01.001',
            '2023-02-10',
            null,
            'FullSet',
            null,
            6200,
            null,
            null,
            0,
            null,
            null,
            null,
            0,
            0,
            0,
            null,
            1,
            null,
          ],
          [
            userId,
            'Audemars Piguet',
            'Royal Oak',
            '15500ST.OO.1220ST.03',
            '2023-07-01',
            null,
            null,
            null,
            45000,
            42000,
            null,
            0,
            null,
            null,
            null,
            0,
            0,
            0,
            'Client is considering a trade.',
            null,
            null,
          ],
        ];

        const watchInsert =
          'INSERT INTO user_watches (user_id, brand, model, reference_number, in_date, serial_number, watch_set, platform_purchased, purchase_price, liquidation_price, accessories, accessories_cost, date_sold, platform_sold, price_sold, fees, shipping, taxes, notes, buyer_contact_id, seller_contact_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        for (const watch of watches) {
          await new Promise((resolve, reject) => {
            db.run(watchInsert, watch, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Seed leads
        const leads = [
          [
            userId,
            'Buy AP Royal Oak 15500ST',
            'Monitoring',
            2,
            '15500ST.OO.1220ST.03',
            'Waiting for price to drop below $40k.',
            null,
          ],
          [
            userId,
            'Sell Rolex Submariner 126610LN',
            'Negotiating',
            1,
            '126610LN',
            null,
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          ],
          [userId, 'Source Patek Philippe 5711', 'Contacted', null, null, 'Reached out to several dealers.', null],
          [userId, 'Offer on Omega Speedmaster', 'Offer Rejected', 2, null, null, null],
          [
            userId,
            'Follow up on Daytona interest',
            'Follow Up',
            null,
            null,
            null,
            new Date().toISOString().split('T')[0],
          ],
        ];

        const leadInsert =
          'INSERT INTO user_leads (user_id, title, status, contact_id, watch_reference, notes, reminder_date) VALUES (?, ?, ?, ?, ?, ?, ?)';

        for (const lead of leads) {
          await new Promise((resolve, reject) => {
            db.run(leadInsert, lead, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Seed cards
        const cards = [[userId, 1, 'John Doe', '4242', '12', '2025']];

        const cardInsert =
          'INSERT INTO user_cards (user_id, contact_id, cardholder_name, last4, expiry_month, expiry_year) VALUES (?, ?, ?, ?, ?, ?)';

        for (const card of cards) {
          await new Promise((resolve, reject) => {
            db.run(cardInsert, card, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Main migration function
async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    await createUserContactsTable();
    console.log('✓ Created user_contacts table');

    await createUserWatchesTable();
    console.log('✓ Created user_watches table');

    await createUserLeadsTable();
    console.log('✓ Created user_leads table');

    await createUserCardsTable();
    console.log('✓ Created user_cards table');

    await createUserInvoicesTable();
    console.log('✓ Created user_invoices table');

    await createUserInvoiceItemsTable();
    console.log('✓ Created user_invoice_items table');

    await createIndexes();
    console.log('✓ Created indexes');

    await seedMockData();
    console.log('✓ Seeded mock data');

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close();
  }
}

// Export for use in other modules
module.exports = { runMigrations, db };

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}
