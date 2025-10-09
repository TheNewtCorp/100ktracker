const { db, getDb, initDB } = require('./db');

// Migration to update invoice tables for the new redesigned system
async function migrateInvoiceTablesForRedesign() {
  console.log('Starting invoice table migration for redesigned system...');

  const currentDb = await getInitializedDb();

  return new Promise((resolve, reject) => {
    // Check current user_invoices table structure
    currentDb.all('PRAGMA table_info(user_invoices)', (err, columns) => {
      if (err) {
        console.error('Error checking user_invoices table structure:', err);
        reject(err);
        return;
      }

      if (!columns || columns.length === 0) {
        console.log('user_invoices table does not exist, will be created with new structure');
        resolve();
        return;
      }

      const existingColumns = columns.map((col) => col.name);
      console.log('Existing user_invoices columns:', existingColumns);

      // Define new columns needed for the redesigned system
      const newColumns = [
        { name: 'invoice_number', type: 'TEXT', defaultValue: null },
        { name: 'square_invoice_id', type: 'TEXT UNIQUE', defaultValue: null },
        { name: 'square_customer_id', type: 'TEXT', defaultValue: null },
        { name: 'payment_processor', type: "TEXT DEFAULT 'square'", defaultValue: "'square'" },
        { name: 'payment_id', type: 'TEXT', defaultValue: null },
        { name: 'payment_status', type: 'TEXT', defaultValue: null },
        { name: 'customer_name', type: 'TEXT', defaultValue: null },
        { name: 'customer_email', type: 'TEXT', defaultValue: null },
        { name: 'customer_phone', type: 'TEXT', defaultValue: null },
        { name: 'customer_company', type: 'TEXT', defaultValue: null },
        { name: 'overdue_at', type: 'DATETIME', defaultValue: null },
        { name: 'sent_at', type: 'DATETIME', defaultValue: null },
        { name: 'fulfilled_at', type: 'DATETIME', defaultValue: null },
        { name: 'cancelled_at', type: 'DATETIME', defaultValue: null },
        { name: 'pdf_generated_at', type: 'DATETIME', defaultValue: null },
        { name: 'square_order_id', type: 'TEXT', defaultValue: null },
      ];

      // Filter out columns that already exist
      const columnsToAdd = newColumns.filter((newCol) => !existingColumns.includes(newCol.name));

      if (columnsToAdd.length === 0) {
        console.log('All required columns already exist in user_invoices table');

        // Also need to update constraints to make contact_id and stripe_invoice_id nullable
        updateInvoiceConstraints(currentDb, resolve, reject);
        return;
      }

      console.log(
        `Adding ${columnsToAdd.length} new columns to user_invoices table:`,
        columnsToAdd.map((c) => c.name),
      );

      // Add new columns one by one
      let addedCount = 0;
      const addNextColumn = () => {
        if (addedCount >= columnsToAdd.length) {
          console.log('Successfully added all new columns to user_invoices table');
          // After adding columns, update constraints
          updateInvoiceConstraints(currentDb, resolve, reject);
          return;
        }

        const column = columnsToAdd[addedCount];
        const alterQuery = `ALTER TABLE user_invoices ADD COLUMN ${column.name} ${column.type}`;

        currentDb.run(alterQuery, (err) => {
          if (err) {
            console.error(`Error adding ${column.name} column:`, err);
            reject(err);
            return;
          }

          console.log(`✓ Added ${column.name} column to user_invoices table`);
          addedCount++;
          addNextColumn();
        });
      };

      addNextColumn();
    });
  });
}

// Helper function to update constraints (make contact_id and stripe_invoice_id nullable)
function updateInvoiceConstraints(currentDb, resolve, reject) {
  console.log('Updating invoice table constraints...');

  // Check if we need to update constraints by looking at the current schema
  currentDb.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_invoices'", (err, row) => {
    if (err) {
      console.error('Error getting table schema:', err);
      reject(err);
      return;
    }

    if (!row) {
      console.log('user_invoices table not found');
      resolve();
      return;
    }

    const currentSchema = row.sql;
    console.log('Current user_invoices schema:', currentSchema);

    // Check if constraints need updating (contact_id should be nullable, stripe_invoice_id should be nullable)
    const needsContactIdUpdate = currentSchema.includes('contact_id INTEGER NOT NULL');
    const needsStripeIdUpdate = currentSchema.includes('stripe_invoice_id TEXT UNIQUE NOT NULL');

    if (!needsContactIdUpdate && !needsStripeIdUpdate) {
      console.log('Invoice table constraints are already correct');
      resolve();
      return;
    }

    console.log('Recreating user_invoices table with updated constraints...');

    // Create new table with correct constraints
    const newTableSQL = `
      CREATE TABLE user_invoices_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        stripe_invoice_id TEXT UNIQUE, -- Made nullable for new system
        square_invoice_id TEXT UNIQUE,
        square_customer_id TEXT,
        contact_id INTEGER, -- Made nullable to support manual customers
        status TEXT NOT NULL DEFAULT 'draft',
        total_amount REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'usd',
        due_date TEXT,
        notes TEXT,
        payment_processor TEXT DEFAULT 'square',
        payment_id TEXT,
        payment_status TEXT,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        customer_company TEXT,
        invoice_number TEXT,
        overdue_at DATETIME,
        sent_at DATETIME,
        fulfilled_at DATETIME,
        cancelled_at DATETIME,
        pdf_generated_at DATETIME,
        square_order_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES user_contacts (id) ON DELETE SET NULL
      )
    `;

    currentDb.run(newTableSQL, (err) => {
      if (err) {
        console.error('Error creating new user_invoices table:', err);
        reject(err);
        return;
      }

      // Copy data from old table to new table
      currentDb.run(
        `
        INSERT INTO user_invoices_new 
        SELECT 
          id, user_id, stripe_invoice_id, 
          NULL as square_invoice_id,
          NULL as square_customer_id,
          contact_id, status, total_amount, currency, due_date, notes,
          'square' as payment_processor,
          NULL as payment_id,
          NULL as payment_status,
          NULL as customer_name,
          NULL as customer_email,
          NULL as customer_phone,
          NULL as customer_company,
          NULL as invoice_number,
          NULL as overdue_at,
          NULL as sent_at,
          NULL as fulfilled_at,
          NULL as cancelled_at,
          NULL as pdf_generated_at,
          NULL as square_order_id,
          created_at, updated_at
        FROM user_invoices
      `,
        (err) => {
          if (err) {
            console.error('Error copying data to new table:', err);
            reject(err);
            return;
          }

          // Drop old table
          currentDb.run('DROP TABLE user_invoices', (err) => {
            if (err) {
              console.error('Error dropping old table:', err);
              reject(err);
              return;
            }

            // Rename new table
            currentDb.run('ALTER TABLE user_invoices_new RENAME TO user_invoices', (err) => {
              if (err) {
                console.error('Error renaming new table:', err);
                reject(err);
                return;
              }

              // Recreate indexes
              const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_user_invoices_user_id ON user_invoices (user_id)',
                'CREATE INDEX IF NOT EXISTS idx_user_invoices_contact_id ON user_invoices (contact_id)',
                'CREATE INDEX IF NOT EXISTS idx_user_invoices_status ON user_invoices (status)',
                'CREATE INDEX IF NOT EXISTS idx_user_invoices_stripe_id ON user_invoices (stripe_invoice_id)',
                'CREATE INDEX IF NOT EXISTS idx_user_invoices_square_id ON user_invoices (square_invoice_id)',
                'CREATE INDEX IF NOT EXISTS idx_user_invoices_payment_id ON user_invoices (payment_id)',
              ];

              let indexCount = 0;
              const createNextIndex = () => {
                if (indexCount >= indexes.length) {
                  console.log('✓ Successfully migrated user_invoices table with new constraints and indexes');
                  resolve();
                  return;
                }

                currentDb.run(indexes[indexCount], (err) => {
                  if (err) {
                    console.warn(`Warning: Could not create index: ${err.message}`);
                  }
                  indexCount++;
                  createNextIndex();
                });
              };

              createNextIndex();
            });
          });
        },
      );
    });
  });
}

// Helper function to get initialized database connection
async function getInitializedDb() {
  let currentDb = getDb();
  if (!currentDb) {
    await initDB();
    currentDb = getDb();
    if (!currentDb) {
      throw new Error('Failed to initialize database');
    }
  }
  return currentDb;
}

module.exports = {
  migrateInvoiceTablesForRedesign,
};
