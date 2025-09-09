// Main Express server setup
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { initDB } = require('./db');
const authRoutes = require('./auth');
const watchRoutes = require('./routes/watches');
const contactRoutes = require('./routes/contacts');
const leadRoutes = require('./routes/leads');
const invoiceRoutes = require('./routes/invoices-safe'); // Safe version without Stripe
const accountRoutes = require('./routes/account');
const webhookRoutes = require('./routes/webhooks'); // Step 5: Webhook integration

const app = express();
// Render assigns PORT automatically for web services, fallback to 3001 for local dev
const PORT = process.env.PORT || 3001;

console.log(`Starting server on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database path: ${process.env.DATABASE_PATH || 'default'}`);

// Initialize database after creating the app
try {
  initDB();
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Database initialization failed:', error);
  // Don't exit, let the server start and handle DB errors gracefully
}

app.use(helmet());

// Configure CORS for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:4173', // Vite preview
      'http://localhost:3000', // Alternative dev server
      'https://100ktracker.netlify.app', // Production frontend
      'https://netlify.app', // Netlify preview deployments
    ];

    // Allow Netlify preview deployments (they have random subdomains)
    if (origin.includes('netlify.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Webhook routes need raw body parsing, so add them before express.json()
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/watches', watchRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/invoices', invoiceRoutes); // Safe version enabled
app.use('/api/account', accountRoutes);

app.get('/', (req, res) => {
  res.send('100KTracker backend running');
});

// Health check endpoint for deployment monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Debug endpoints for production troubleshooting
app.get('/api/env-check', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    hasJwtSecret: !!process.env.JWT_SECRET,
    appUrl: process.env.APP_URL,
    databasePath: process.env.DATABASE_PATH,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/db-status', (req, res) => {
  try {
    const dbPath = process.env.DATABASE_PATH || './db/database.sqlite';
    const fs = require('fs');
    const dbExists = fs.existsSync(dbPath);

    res.json({
      databasePath: dbPath,
      databaseExists: dbExists,
      canWrite: fs.constants ? true : false, // Basic write check
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database status check failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
