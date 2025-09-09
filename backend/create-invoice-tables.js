const { db } = require('./db');

async function createInvoicesTable() {
  console.log('Creating invoices table for Step 5 implementation...');

  try {
    // Create invoices table for local tracking
    await new Promise((resolve, reject) => {
      db.run(
        `
                CREATE TABLE IF NOT EXISTS invoices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    contact_id INTEGER,
                    stripe_invoice_id TEXT NOT NULL UNIQUE,
                    stripe_customer_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'draft',
                    total_amount DECIMAL(10,2) NOT NULL,
                    currency TEXT DEFAULT 'usd',
                    description TEXT,
                    hosted_invoice_url TEXT,
                    invoice_pdf TEXT,
                    payment_intent TEXT,
                    paid_at DATETIME,
                    amount_paid DECIMAL(10,2),
                    last_payment_error TEXT,
                    payment_attempt_count INTEGER DEFAULT 0,
                    finalized_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (contact_id) REFERENCES user_contacts(id)
                )
            `,
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    console.log('✅ Invoices table created successfully');

    // Create invoice_items table for line items
    await new Promise((resolve, reject) => {
      db.run(
        `
                CREATE TABLE IF NOT EXISTS invoice_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoice_id INTEGER NOT NULL,
                    watch_id INTEGER,
                    description TEXT NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    unit_price DECIMAL(10,2) NOT NULL,
                    total_amount DECIMAL(10,2) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
                    FOREIGN KEY (watch_id) REFERENCES user_watches(id)
                )
            `,
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    console.log('✅ Invoice items table created successfully');

    // Create indexes for better performance
    await new Promise((resolve, reject) => {
      db.run(
        `
                CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id)
            `,
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    await new Promise((resolve, reject) => {
      db.run(
        `
                CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id ON invoices(stripe_invoice_id)
            `,
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    await new Promise((resolve, reject) => {
      db.run(
        `
                CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)
            `,
        function (err) {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    console.log('✅ Invoice indexes created successfully');
    console.log('🎉 Step 5 database setup complete!');
  } catch (error) {
    console.error('❌ Error creating invoices tables:', error);
    throw error;
  }
}

// Run the migration
createInvoicesTable()
  .then(() => {
    console.log('✨ Invoice tables created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
