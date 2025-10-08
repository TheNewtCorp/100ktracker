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

// Run migrations for user table columns
function runUserTableMigrations() {
  return new Promise((resolve, reject) => {
    // Check if temporary_password column exists
    db.all('PRAGMA table_info(users)', (err, columns) => {
      if (err) {
        reject(new Error(`Failed to get table info: ${err.message}`));
        return;
      }

      const hasTemporaryPassword = columns.some((col) => col.name === 'temporary_password');

      if (hasTemporaryPassword) {
        console.log('✓ temporary_password column already exists');
        resolve();
        return;
      }

      // Add the temporary_password column
      console.log('Adding temporary_password column to users table...');
      db.run('ALTER TABLE users ADD COLUMN temporary_password INTEGER DEFAULT 0', (err) => {
        if (err) {
          reject(new Error(`Failed to add temporary_password column: ${err.message}`));
          return;
        }

        console.log('✓ Added temporary_password column to users table');
        resolve();
      });
    });
  });
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
      stripe_publishable_key TEXT,
      square_customer_id TEXT,
      square_subscription_id TEXT,
      payment_processor TEXT DEFAULT 'square',
      subscription_tier TEXT DEFAULT NULL,
      subscription_status TEXT DEFAULT 'free',
      subscription_price REAL DEFAULT 0,
      subscription_start_date DATETIME DEFAULT NULL,
      subscription_end_date DATETIME DEFAULT NULL,
      stripe_subscription_id TEXT DEFAULT NULL,
      temporary_password INTEGER DEFAULT 0
    )`,
      (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
          reject(err);
          return;
        }
        console.log('Users table created/verified');

        // Run column migrations after table creation
        runUserTableMigrations()
          .then(() => {
            console.log('User table migrations completed');
          })
          .catch((migrationErr) => {
            console.error('Migration error (non-fatal):', migrationErr.message);
            // Don't reject here, migrations are non-fatal for existing deployments
          });

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
                  // Run migrations
                  Promise.all([
                    migrateToSquareColumns(),
                    migrateStripeColumns(),
                    migrateInvoicesTableColumns(),
                    migrateInvoiceContactConstraint(),
                    migrateSubscriptionColumns(),
                  ])
                    .then(() => {
                      resolve();
                    })
                    .catch((migrationErr) => {
                      console.error('Error during migrations:', migrationErr.message);
                      reject(migrationErr);
                    });
                }
              },
            );
          } else {
            console.log('Admin user already exists');
            // Run migrations and create promo admin user
            Promise.all([
              migrateToSquareColumns(),
              migrateStripeColumns(),
              migrateInvoicesTableColumns(),
              migrateInvoiceContactConstraint(),
              migrateSubscriptionColumns(),
              migrateLoginTrackingColumns(),
            ])
              .then(() => {
                // Create admin users and audit table after migrations
                return Promise.all([
                  createProvisioningAuditTable(),
                  new Promise((resolve) => {
                    createPromoAdminUser((err) => {
                      if (err) {
                        console.error('Error creating promo admin user (non-fatal):', err.message);
                      }
                      resolve();
                    });
                  }),
                  new Promise((resolve) => {
                    createGeneralAdminUser((err) => {
                      if (err) {
                        console.error('Error creating general admin user (non-fatal):', err.message);
                      }
                      resolve();
                    });
                  }),
                ]);
              })
              .then(() => {
                resolve();
              })
              .catch((migrationErr) => {
                console.error('Error during migrations:', migrationErr.message);
                reject(migrationErr);
              });
          }
        });
      },
    );
  });
}

// Migrate existing databases to add Square columns and remove Stripe columns
function migrateToSquareColumns() {
  return new Promise((resolve, reject) => {
    // Get all column information
    db.all('PRAGMA table_info(users)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const hasStripeSecretKey = columns.some((col) => col.name === 'stripe_secret_key');
      const hasStripePublishableKey = columns.some((col) => col.name === 'stripe_publishable_key');
      const hasStripeSubscriptionId = columns.some((col) => col.name === 'stripe_subscription_id');
      const hasSquareCustomerId = columns.some((col) => col.name === 'square_customer_id');
      const hasSquareSubscriptionId = columns.some((col) => col.name === 'square_subscription_id');
      const hasPaymentProcessor = columns.some((col) => col.name === 'payment_processor');

      const migrations = [];

      // Add Square columns if they don't exist
      if (!hasSquareCustomerId) {
        migrations.push(
          new Promise((resolveCol, rejectCol) => {
            db.run('ALTER TABLE users ADD COLUMN square_customer_id TEXT', (err) => {
              if (err) {
                console.error('Error adding square_customer_id column:', err.message);
                rejectCol(err);
              } else {
                console.log('Added square_customer_id column to users table');
                resolveCol();
              }
            });
          }),
        );
      }

      if (!hasSquareSubscriptionId) {
        migrations.push(
          new Promise((resolveCol, rejectCol) => {
            db.run('ALTER TABLE users ADD COLUMN square_subscription_id TEXT', (err) => {
              if (err) {
                console.error('Error adding square_subscription_id column:', err.message);
                rejectCol(err);
              } else {
                console.log('Added square_subscription_id column to users table');
                resolveCol();
              }
            });
          }),
        );
      }

      if (!hasPaymentProcessor) {
        migrations.push(
          new Promise((resolveCol, rejectCol) => {
            db.run('ALTER TABLE users ADD COLUMN payment_processor TEXT DEFAULT "square"', (err) => {
              if (err) {
                console.error('Error adding payment_processor column:', err.message);
                rejectCol(err);
              } else {
                console.log('Added payment_processor column to users table');
                resolveCol();
              }
            });
          }),
        );
      }

      if (migrations.length === 0) {
        console.log('Square columns already exist in users table');
        resolve();
      } else {
        Promise.all(migrations)
          .then(() => {
            console.log('All Square column migrations completed successfully');
            resolve();
          })
          .catch((migrationError) => {
            console.error('Error during Square column migration:', migrationError);
            reject(migrationError);
          });
      }
    });
  });
}

// Legacy function - kept for backward compatibility during transition
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

// Migrate existing user_invoices table to add missing columns for Stripe integration
function migrateInvoicesTableColumns() {
  return new Promise((resolve, reject) => {
    // Check if user_invoices table exists and get its structure
    db.all('PRAGMA table_info(user_invoices)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      if (columns.length === 0) {
        console.log('user_invoices table does not exist, will be created by createAllTables');
        resolve();
        return;
      }

      const existingColumns = columns.map((col) => col.name);
      const neededColumns = [
        { name: 'stripe_customer_id', type: 'TEXT' },
        { name: 'description', type: 'TEXT' },
        { name: 'hosted_invoice_url', type: 'TEXT' },
        { name: 'invoice_pdf', type: 'TEXT' },
        { name: 'finalized_at', type: 'DATETIME' },
        { name: 'metadata', type: 'TEXT' },
      ];

      const migrations = [];

      for (const column of neededColumns) {
        if (!existingColumns.includes(column.name)) {
          migrations.push(
            new Promise((resolveCol, rejectCol) => {
              db.run(`ALTER TABLE user_invoices ADD COLUMN ${column.name} ${column.type}`, (err) => {
                if (err) {
                  console.error(`Error adding ${column.name} column:`, err.message);
                  rejectCol(err);
                } else {
                  console.log(`Added ${column.name} column to user_invoices table`);
                  resolveCol();
                }
              });
            }),
          );
        }
      }

      if (migrations.length === 0) {
        console.log('All required invoice columns already exist');
        resolve();
      } else {
        Promise.all(migrations)
          .then(() => {
            console.log('Invoice table migration completed successfully');
            resolve();
          })
          .catch(reject);
      }
    });
  });
}

// Migrate contact_id constraint in user_invoices table to allow NULL values
function migrateInvoiceContactConstraint() {
  return new Promise((resolve, reject) => {
    // Check if user_invoices table exists first
    db.all('PRAGMA table_info(user_invoices)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      if (columns.length === 0) {
        console.log('user_invoices table does not exist, will be created by createAllTables');
        resolve();
        return;
      }

      // Check if contact_id column is NOT NULL
      const contactIdColumn = columns.find((col) => col.name === 'contact_id');

      if (!contactIdColumn) {
        console.log('contact_id column does not exist, skipping constraint migration');
        resolve();
        return;
      }

      // SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
      // if the column is currently NOT NULL
      if (contactIdColumn.notnull === 1) {
        console.log('Migrating user_invoices table to allow NULL contact_id...');

        // Create a transaction to safely migrate the table
        db.serialize(() => {
          db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              reject(err);
              return;
            }

            // Create new table with nullable contact_id
            db.run(
              `
              CREATE TABLE user_invoices_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                stripe_invoice_id TEXT UNIQUE NOT NULL,
                contact_id INTEGER, -- Made nullable
                status TEXT NOT NULL DEFAULT 'draft',
                total_amount REAL NOT NULL DEFAULT 0,
                currency TEXT NOT NULL DEFAULT 'usd',
                due_date TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                stripe_customer_id TEXT,
                description TEXT,
                hosted_invoice_url TEXT,
                invoice_pdf TEXT,
                finalized_at DATETIME,
                metadata TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (contact_id) REFERENCES user_contacts (id) ON DELETE CASCADE
              )
            `,
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                // Copy data from old table to new table
                db.run(
                  `
                INSERT INTO user_invoices_new 
                SELECT * FROM user_invoices
              `,
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      reject(err);
                      return;
                    }

                    // Drop old table
                    db.run('DROP TABLE user_invoices', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                      }

                      // Rename new table to original name
                      db.run('ALTER TABLE user_invoices_new RENAME TO user_invoices', (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          reject(err);
                          return;
                        }

                        // Commit the transaction
                        db.run('COMMIT', (err) => {
                          if (err) {
                            reject(err);
                          } else {
                            console.log('Successfully migrated user_invoices table to allow NULL contact_id');
                            resolve();
                          }
                        });
                      });
                    });
                  },
                );
              },
            );
          });
        });
      } else {
        console.log('user_invoices.contact_id already allows NULL values');
        resolve();
      }
    });
  });
}

// Migrate users table to add subscription columns
function migrateSubscriptionColumns() {
  return new Promise((resolve, reject) => {
    // Check if users table exists and get its structure
    db.all('PRAGMA table_info(users)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      if (columns.length === 0) {
        console.log('users table does not exist, will be created by createAllTables');
        resolve();
        return;
      }

      const existingColumns = columns.map((col) => col.name);
      const neededColumns = [
        {
          name: 'subscription_tier',
          type: 'TEXT DEFAULT NULL',
          description: 'Subscription tier: platinum, operandi, or free',
        },
        {
          name: 'subscription_status',
          type: "TEXT DEFAULT 'free'",
          description: 'Subscription status: active, past_due, canceled, free',
        },
        { name: 'subscription_price', type: 'REAL DEFAULT 0', description: 'Monthly subscription price in USD' },
        { name: 'subscription_start_date', type: 'DATETIME DEFAULT NULL', description: 'When subscription started' },
        { name: 'subscription_end_date', type: 'DATETIME DEFAULT NULL', description: 'When subscription ends/ended' },
        {
          name: 'stripe_subscription_id',
          type: 'TEXT DEFAULT NULL',
          description: 'Stripe subscription ID for automated billing',
        },
      ];

      const migrations = [];

      for (const column of neededColumns) {
        if (!existingColumns.includes(column.name)) {
          migrations.push(
            new Promise((resolveCol, rejectCol) => {
              db.run(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`, (err) => {
                if (err) {
                  console.error(`Error adding ${column.name} column:`, err.message);
                  rejectCol(err);
                } else {
                  console.log(`Added ${column.name} column to users table`);
                  resolveCol();
                }
              });
            }),
          );
        }
      }

      if (migrations.length === 0) {
        console.log('All required subscription columns already exist in users table');
        resolve();
      } else {
        Promise.all(migrations)
          .then(() => {
            console.log('Subscription columns migration completed successfully');
            resolve();
          })
          .catch(reject);
      }
    });
  });
}

// Migrate login tracking columns
function migrateLoginTrackingColumns() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    // Check existing columns
    db.all('PRAGMA table_info(users)', (err, columns) => {
      if (err) {
        reject(err);
        return;
      }

      const existingColumns = columns.map((col) => col.name);
      console.log('Checking for login tracking columns...');

      const neededColumns = [
        {
          name: 'first_login_date',
          type: 'TEXT DEFAULT NULL',
          description: "Timestamp of user's first login",
        },
        {
          name: 'last_login_date',
          type: 'TEXT DEFAULT NULL',
          description: "Timestamp of user's most recent login",
        },
        {
          name: 'login_count',
          type: 'INTEGER DEFAULT 0',
          description: 'Total number of successful logins',
        },
        {
          name: 'last_jwt_issued',
          type: 'TEXT DEFAULT NULL',
          description: 'Timestamp when JWT was last issued',
        },
        {
          name: 'registration_date',
          type: 'TEXT DEFAULT NULL',
          description: 'When the user account was created',
        },
      ];

      const migrations = [];

      for (const column of neededColumns) {
        if (!existingColumns.includes(column.name)) {
          migrations.push(
            new Promise((resolveCol, rejectCol) => {
              db.run(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`, (err) => {
                if (err) {
                  console.error(`Error adding ${column.name} column:`, err.message);
                  rejectCol(err);
                } else {
                  console.log(`Added ${column.name} column to users table`);
                  resolveCol();
                }
              });
            }),
          );
        }
      }

      if (migrations.length === 0) {
        console.log('All required login tracking columns already exist in users table');
        resolve();
      } else {
        Promise.all(migrations)
          .then(() => {
            console.log('Login tracking columns migration completed');
            resolve();
          })
          .catch(reject);
      }
    });
  });
}

// Create all application tables
function createAllTables() {
  return Promise.all([
    createUserWatchesTable(),
    createUserContactsTable(),
    createWatchHistoryTable(),
    createUserLeadsTable(),
    createUserCardsTable(),
    createUserInvoicesTable(),
    createUserInvoiceItemsTable(),
    createPromoSignupsTable(),
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
      stripe_customer_id TEXT, -- Legacy Stripe customer ID for invoicing
      square_customer_id TEXT, -- Square customer ID for invoicing
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

function createWatchHistoryTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS watch_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      watch_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
      field_name TEXT, -- Field that was changed (null for creation/deletion)
      old_value TEXT, -- Previous value (JSON string for complex values)
      new_value TEXT, -- New value (JSON string for complex values)
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (watch_id) REFERENCES user_watches (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
      (err) => {
        if (err) {
          console.error('Error creating watch_history table:', err.message);
          reject(err);
        } else {
          console.log('watch_history table created/verified');
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
      stripe_invoice_id TEXT UNIQUE, -- Legacy Stripe invoice ID
      square_invoice_id TEXT UNIQUE, -- Square invoice ID
      payment_processor TEXT DEFAULT 'square', -- 'stripe' or 'square'
      contact_id INTEGER, -- Made nullable to support manual customers
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

function createPromoSignupsTable() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS promo_signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      business_name TEXT,
      referral_source TEXT,
      experience_level TEXT,
      interests TEXT,
      comments TEXT,
      signup_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
      (err) => {
        if (err) {
          console.error('Error creating promo_signups table:', err.message);
          reject(err);
        } else {
          console.log('✓ Promo signups table created/verified');
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

// Get all users (for admin purposes)
function getAllUsers() {
  return new Promise((resolve, reject) => {
    try {
      ensureDbConnection();
      db.all('SELECT * FROM users ORDER BY username ASC', [], (err, rows) => {
        if (err) {
          console.error('Error getting all users:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    } catch (error) {
      console.error('Database connection error in getAllUsers:', error.message);
      reject(error);
    }
  });
}

// Get user by username (for admin purposes)
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    try {
      ensureDbConnection();
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
          console.error('Error getting user by username:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    } catch (error) {
      console.error('Database connection error in getUserByUsername:', error.message);
      reject(error);
    }
  });
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
    function (err) {
      if (err) {
        return callback(err);
      }

      const watchId = this.lastID;
      // Record the watch creation in history
      createWatchHistoryEntry(watchId, userId, 'created', null, null, null, (historyErr) => {
        if (historyErr) {
          console.error('Failed to record watch creation in history:', historyErr);
        }
        // Still call the original callback with the watch creation result
        callback(err, { id: watchId, changes: this.changes });
      });
    },
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

  // First, get the old data for change tracking
  db.get('SELECT * FROM user_watches WHERE id = ? AND user_id = ?', [watchId, userId], (err, oldData) => {
    if (err) {
      return callback(err);
    }

    if (!oldData) {
      return callback(new Error('Watch not found'));
    }

    // Now perform the update
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
      function (updateErr) {
        if (updateErr) {
          return callback(updateErr);
        }

        // Track the changes
        trackWatchChange(watchId, userId, oldData, watchData, (trackErr) => {
          if (trackErr) {
            console.error('Failed to track watch changes:', trackErr);
          }
          // Still call the original callback with the update result
          callback(updateErr, { changes: this.changes });
        });
      },
    );
  });
}

// Watch History Functions
function createWatchHistoryEntry(
  watchId,
  userId,
  changeType,
  fieldName = null,
  oldValue = null,
  newValue = null,
  callback,
) {
  db.run(
    `INSERT INTO watch_history (watch_id, user_id, change_type, field_name, old_value, new_value) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [watchId, userId, changeType, fieldName, oldValue, newValue],
    callback,
  );
}

function getWatchHistory(watchId, callback) {
  db.all(
    `SELECT * FROM watch_history 
     WHERE watch_id = ? 
     ORDER BY timestamp DESC`,
    [watchId],
    callback,
  );
}

function trackWatchChange(watchId, userId, oldData, newData, callback) {
  const changes = [];
  const fieldsToTrack = [
    'brand',
    'model',
    'reference_number',
    'in_date',
    'serial_number',
    'watch_set',
    'platform_purchased',
    'purchase_price',
    'liquidation_price',
    'accessories',
    'accessories_cost',
    'date_sold',
    'platform_sold',
    'price_sold',
    'fees',
    'shipping',
    'taxes',
    'notes',
    'buyer_contact_id',
    'seller_contact_id',
  ];

  fieldsToTrack.forEach((field) => {
    const oldVal = oldData ? oldData[field] : null;
    const newVal = newData ? newData[field] : null;

    // Convert to strings for comparison (handle nulls and numbers)
    const oldStr = oldVal === null || oldVal === undefined ? null : String(oldVal);
    const newStr = newVal === null || newVal === undefined ? null : String(newVal);

    if (oldStr !== newStr) {
      changes.push({
        field: field,
        oldValue: oldStr,
        newValue: newStr,
      });
    }
  });

  if (changes.length === 0) {
    return callback(null, { changesRecorded: 0 });
  }

  let completed = 0;
  let errors = [];

  changes.forEach((change) => {
    createWatchHistoryEntry(watchId, userId, 'updated', change.field, change.oldValue, change.newValue, (err) => {
      if (err) errors.push(err);
      completed++;

      if (completed === changes.length) {
        if (errors.length > 0) {
          callback(errors[0], { changesRecorded: completed - errors.length, errors });
        } else {
          callback(null, { changesRecorded: completed });
        }
      }
    });
  });
}

function deleteUserWatch(userId, watchId, callback) {
  // Record the deletion in history before deleting
  createWatchHistoryEntry(watchId, userId, 'deleted', null, null, null, (historyErr) => {
    if (historyErr) {
      console.error('Failed to record watch deletion in history:', historyErr);
    }

    // Proceed with deletion regardless of history recording success
    db.run('DELETE FROM user_watches WHERE id = ? AND user_id = ?', [watchId, userId], callback);
  });
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

// Comprehensive user update function for admin panel
function updateUser(userId, userData, callback = () => {}) {
  if (!db) {
    initDB();
    getDb();
    if (!db) {
      callback(new Error('Database not initialized'));
      return;
    }
  }

  const {
    username,
    email,
    subscription_tier,
    subscription_status,
    status,
    subscription_price,
    subscription_start_date,
    subscription_end_date,
  } = userData;

  // Build dynamic update query based on provided fields
  const updateFields = [];
  const updateValues = [];

  if (username !== undefined) {
    updateFields.push('username = ?');
    updateValues.push(username);
  }

  if (email !== undefined) {
    updateFields.push('email = ?');
    updateValues.push(email);
  }

  if (subscription_tier !== undefined) {
    updateFields.push('subscription_tier = ?');
    updateValues.push(subscription_tier);
  }

  if (subscription_status !== undefined) {
    updateFields.push('subscription_status = ?');
    updateValues.push(subscription_status);
  }

  if (status !== undefined) {
    updateFields.push('status = ?');
    updateValues.push(status);
  }

  if (subscription_price !== undefined) {
    updateFields.push('subscription_price = ?');
    updateValues.push(subscription_price);
  }

  if (subscription_start_date !== undefined) {
    updateFields.push('subscription_start_date = ?');
    updateValues.push(subscription_start_date);
  }

  if (subscription_end_date !== undefined) {
    updateFields.push('subscription_end_date = ?');
    updateValues.push(subscription_end_date);
  }

  if (updateFields.length === 0) {
    callback(new Error('No fields to update'));
    return;
  }

  // Add userId to the end of values array
  updateValues.push(userId);

  const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

  db.run(query, updateValues, function (err) {
    if (err) {
      callback(err);
      return;
    }

    if (this.changes === 0) {
      callback(new Error('User not found or no changes made'));
      return;
    }

    callback(null, { userId, changes: this.changes });
  });
}

// Login tracking functions
function recordUserLogin(userId, callback = () => {}) {
  if (!db) {
    callback(new Error('Database not initialized'));
    return;
  }

  const now = new Date().toISOString();

  // First, check if this is the user's first login
  db.get('SELECT first_login_date, login_count FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      callback(err);
      return;
    }

    if (!user) {
      callback(new Error('User not found'));
      return;
    }

    // Update login tracking
    if (!user.first_login_date) {
      // First time login
      db.run(
        `
        UPDATE users 
        SET first_login_date = ?, 
            last_login_date = ?, 
            login_count = 1, 
            last_jwt_issued = ?,
            status = 'active'
        WHERE id = ?
      `,
        [now, now, now, userId],
        callback,
      );
    } else {
      // Returning user login
      const newCount = (user.login_count || 0) + 1;
      db.run(
        `
        UPDATE users 
        SET last_login_date = ?, 
            login_count = ?, 
            last_jwt_issued = ?
        WHERE id = ?
      `,
        [now, newCount, now, userId],
        callback,
      );
    }
  });
}

function getUserLoginStats(userId, callback) {
  if (!db) {
    callback(new Error('Database not initialized'), null);
    return;
  }

  db.get(
    `
    SELECT 
      first_login_date,
      last_login_date,
      login_count,
      last_jwt_issued,
      registration_date,
      status
    FROM users 
    WHERE id = ?
  `,
    [userId],
    callback,
  );
}

function getAllUsersLoginStats(callback) {
  if (!db) {
    callback(new Error('Database not initialized'), null);
    return;
  }

  db.all(
    `
    SELECT 
      id,
      username,
      email,
      status,
      first_login_date,
      last_login_date,
      login_count,
      last_jwt_issued,
      registration_date,
      subscription_tier,
      subscription_status
    FROM users 
    WHERE id > 1
    ORDER BY id DESC
  `,
    [],
    callback,
  );
}

// Subscription management functions
function getUserSubscription(userId, callback) {
  if (db) {
    db.get(
      `SELECT subscription_tier, subscription_status, subscription_price, 
              subscription_start_date, subscription_end_date, stripe_subscription_id 
       FROM users WHERE id = ?`,
      [userId],
      callback,
    );
  } else {
    callback(new Error('Database not initialized'), null);
  }
}

function updateUserSubscription(userId, subscriptionData, callback = () => {}) {
  const { tier, status, price, startDate, endDate, stripeSubscriptionId } = subscriptionData;

  if (db) {
    db.run(
      `UPDATE users SET 
        subscription_tier = ?, 
        subscription_status = ?, 
        subscription_price = ?,
        subscription_start_date = ?,
        subscription_end_date = ?,
        stripe_subscription_id = ?
      WHERE id = ?`,
      [tier, status, price, startDate, endDate, stripeSubscriptionId, userId],
      callback,
    );
  } else {
    callback(new Error('Database not initialized'));
  }
}

function setUserSubscriptionByUsername(username, subscriptionData, callback = () => {}) {
  const { tier, status, price, startDate, endDate, stripeSubscriptionId } = subscriptionData;

  if (db) {
    db.run(
      `UPDATE users SET 
        subscription_tier = ?, 
        subscription_status = ?, 
        subscription_price = ?,
        subscription_start_date = ?,
        subscription_end_date = ?,
        stripe_subscription_id = ?
      WHERE username = ?`,
      [tier, status, price, startDate, endDate, stripeSubscriptionId, username],
      callback,
    );
  } else {
    callback(new Error('Database not initialized'));
  }
}

// Get subscription tier information
function getSubscriptionTierInfo(tier) {
  const tiers = {
    platinum: { name: 'Platinum Tracker', price: 98, description: 'Premium watch tracking with advanced features' },
    operandi: {
      name: 'Operandi Challenge Tracker',
      price: 80,
      description: 'Enhanced tracking for serious collectors',
    },
    free: { name: 'Basic Plan', price: 0, description: 'Basic watch tracking functionality' },
  };

  return tiers[tier] || tiers['free'];
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

// Promo signup functions
function createPromoSignup(signupData, callback) {
  const { fullName, email, phone, businessName, referralSource, experienceLevel, interests, comments } = signupData;

  const query = `
    INSERT INTO promo_signups (
      full_name, email, phone, business_name, referral_source, 
      experience_level, interests, comments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [fullName, email, phone, businessName, referralSource, experienceLevel, interests, comments];

  db.run(query, values, function (err) {
    if (callback) {
      if (err) {
        callback(err);
      } else {
        callback(null, { id: this.lastID, ...signupData });
      }
    }
  });
}

function getAllPromoSignups(callback) {
  const query = `
    SELECT * FROM promo_signups 
    ORDER BY created_at DESC
  `;

  db.all(query, [], callback);
}

function getPromoSignupById(id, callback) {
  db.get('SELECT * FROM promo_signups WHERE id = ?', [id], callback);
}

function updatePromoSignupStatus(id, status, adminNotes, callback) {
  const query = `
    UPDATE promo_signups 
    SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;

  db.run(query, [status, adminNotes, id], callback);
}

function getPromoSignupsByStatus(status, callback) {
  const query = `
    SELECT * FROM promo_signups 
    WHERE status = ? 
    ORDER BY created_at DESC
  `;

  db.all(query, [status], callback);
}

// Create or verify promo admin user exists
function createPromoAdminUser(callback) {
  const adminUsername = '100ktrackeradmin';
  const adminPassword = 'Nn03241929$&@';
  const adminEmail = '100kprofittracker@gmail.com';

  // Check if promo admin user exists
  db.get('SELECT * FROM users WHERE username = ?', [adminUsername], (err, user) => {
    if (err) {
      return callback(err);
    }

    if (user) {
      console.log('✓ Promo admin user already exists');
      return callback(null, user);
    }

    // Create the promo admin user
    console.log('Creating promo admin user...');
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);

    db.run(
      'INSERT INTO users (username, hashed_password, email, temporary_password) VALUES (?, ?, ?, ?)',
      [adminUsername, hashedPassword, adminEmail, 0],
      function (err) {
        if (err) {
          console.error('Error creating promo admin user:', err.message);
          return callback(err);
        }

        console.log('✓ Promo admin user created successfully');

        // Return the created user info
        db.get('SELECT * FROM users WHERE id = ?', [this.lastID], callback);
      },
    );
  });
}

// Verify if a user is the promo admin
function isPromoAdmin(username, callback) {
  const adminUsername = '100ktrackeradmin';
  callback(null, username === adminUsername);
}

// Create or verify general admin user exists
function createGeneralAdminUser(callback) {
  const adminUsername = '100ktrackeradmin-general';
  const adminPassword = 'Nn03241929$&@Gen';
  const adminEmail = '100kprofittracker+general@gmail.com';

  // Check if general admin user exists
  db.get('SELECT * FROM users WHERE username = ?', [adminUsername], (err, user) => {
    if (err) {
      return callback(err);
    }

    if (user) {
      console.log('✓ General admin user already exists');
      return callback(null, user);
    }

    // Create the general admin user
    console.log('Creating general admin user...');
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);

    db.run(
      'INSERT INTO users (username, hashed_password, email, temporary_password) VALUES (?, ?, ?, ?)',
      [adminUsername, hashedPassword, adminEmail, 0],
      function (err) {
        if (err) {
          console.error('Error creating general admin user:', err.message);
          return callback(err);
        }

        console.log('✓ General admin user created successfully');

        // Return the created user info
        db.get('SELECT * FROM users WHERE id = ?', [this.lastID], callback);
      },
    );
  });
}

// Verify if a user is the general admin
function isGeneralAdmin(username, callback) {
  const adminUsername = '100ktrackeradmin-general';
  callback(null, username === adminUsername);
}

// Database transaction wrapper for account provisioning
function runProvisioningTransaction(operations, callback) {
  if (!db) {
    return callback(new Error('Database not initialized'));
  }

  // Start transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return callback(err);
    }

    // Execute operations sequentially
    const executeNext = (index, results = []) => {
      if (index >= operations.length) {
        // All operations successful, commit
        db.run('COMMIT', (commitErr) => {
          if (commitErr) {
            return callback(commitErr);
          }
          callback(null, results);
        });
        return;
      }

      const operation = operations[index];
      operation((operationErr, result) => {
        if (operationErr) {
          // Rollback on error
          db.run('ROLLBACK', () => {
            callback(operationErr);
          });
          return;
        }

        results.push(result);
        executeNext(index + 1, results);
      });
    };

    executeNext(0);
  });
}

// Add audit logging for provisioning attempts
function logProvisioningAttempt(data, callback) {
  const query = `
    INSERT INTO provisioning_audit (
      email, full_name, subscription_tier, admin_user, 
      step_completed, success, error_message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  db.run(
    query,
    [
      data.email,
      data.fullName,
      data.subscriptionTier,
      data.adminUser,
      data.stepCompleted,
      data.success ? 1 : 0,
      data.errorMessage || null,
    ],
    callback,
  );
}

// Create provisioning audit table
function createProvisioningAuditTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS provisioning_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      full_name TEXT,
      subscription_tier TEXT,
      admin_user TEXT,
      step_completed TEXT,
      success INTEGER,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;

  return new Promise((resolve, reject) => {
    db.run(createTableQuery, (err) => {
      if (err) {
        console.error('Error creating provisioning_audit table:', err);
        reject(err);
      } else {
        console.log('✓ Provisioning audit table created/verified');
        resolve();
      }
    });
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
  getAllUsers,
  getUserByUsername,
  verifyPassword,
  updateFirstLoginTimestamp,
  updateUserStatus,
  updateInvitationTimestamp,
  updateUsername,
  updateUser,
  // Login tracking
  migrateLoginTrackingColumns,
  recordUserLogin,
  getUserLoginStats,
  getAllUsersLoginStats,
  // Subscriptions
  getUserSubscription,
  updateUserSubscription,
  setUserSubscriptionByUsername,
  getSubscriptionTierInfo,
  // Watches
  getUserWatches,
  createUserWatch,
  updateUserWatch,
  deleteUserWatch,
  bulkDeleteUserWatches,
  // Watch History
  createWatchHistoryEntry,
  getWatchHistory,
  trackWatchChange,
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
  // Promo signups
  createPromoSignup,
  getAllPromoSignups,
  getPromoSignupById,
  updatePromoSignupStatus,
  getPromoSignupsByStatus,
  // Promo admin
  createPromoAdminUser,
  isPromoAdmin,
  // General admin & provisioning
  createGeneralAdminUser,
  isGeneralAdmin,
  runProvisioningTransaction,
  logProvisioningAttempt,
  createProvisioningAuditTable,
};
