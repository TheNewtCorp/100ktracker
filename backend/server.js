// Main Express server setup
require('dotenv').config();

// Log environment variables for debugging (in production)
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- PORT:', process.env.PORT || 'not set (will use default)');
console.log('- DATABASE_PATH:', process.env.DATABASE_PATH || 'not set (will use default)');
console.log('- APP_URL:', process.env.APP_URL || 'not set');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { initDB, closeDB } = require('./db');
const authRoutes = require('./auth');
const watchRoutes = require('./routes/watches');
const contactRoutes = require('./routes/contacts');
const leadRoutes = require('./routes/leads');
const invoiceRoutes = require('./routes/invoices-safe'); // Safe version without Stripe
const accountRoutes = require('./routes/account');
const webhookRoutes = require('./routes/webhooks'); // Step 5: Webhook integration
const promoRoutes = require('./routes/promo'); // Operandi Challenge promo routes

const app = express();
// Render assigns PORT automatically for web services, fallback to 3001 for local dev
const PORT = process.env.PORT || 3001;

console.log(`Starting server on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database path: ${process.env.DATABASE_PATH || 'default'}`);

// Initialize database after creating the app
async function startServer() {
  try {
    await initDB();
    console.log('Database initialized successfully');

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown handling
    let isShuttingDown = false;

    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) {
        console.log(`${signal} received again, forcing exit`);
        process.exit(1);
      }

      isShuttingDown = true;
      global.isShuttingDown = true; // Set global flag for middleware
      console.log(`${signal} received, shutting down gracefully`);

      // Stop accepting new requests first
      server.close(async () => {
        console.log('Server stopped accepting new connections');
        try {
          await closeDB();
          console.log('Database closed successfully');
          process.exit(0);
        } catch (error) {
          console.error('Error closing database:', error.message);
          process.exit(1);
        }
      });

      // Force exit after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        console.error('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

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
      'https://100ktracker.netlify.app', // Original Netlify frontend
      'https://100ktracker.com', // Custom domain
      'https://www.100ktracker.com', // Custom domain with www
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

// Middleware to reject requests during shutdown
app.use((req, res, next) => {
  if (req.url === '/health') {
    // Always allow health checks
    return next();
  }

  // Check if shutdown is in progress
  if (global.isShuttingDown) {
    return res.status(503).json({
      error: 'Server is shutting down',
      message: 'Please retry your request',
    });
  }

  next();
});

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
app.use('/api/promo', promoRoutes); // Operandi Challenge promo routes

app.get('/', (req, res) => {
  res.send('100KTracker backend running');
});

// Health check endpoint for deployment monitoring
app.get('/health', (req, res) => {
  const { db } = require('./db');
  const dbStatus = db ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'healthy',
    database: dbStatus,
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
