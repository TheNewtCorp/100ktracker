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
    const gracefulShutdown = async (signal) => {
      console.log(`${signal} received, shutting down gracefully`);
      
      // Close database connection first
      try {
        await closeDB();
      } catch (error) {
        console.error('Error closing database:', error);
      }
      
      // Then close the server
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
      
      // Force exit after 10 seconds if server doesn't close
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
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
app.get('/health', async (req, res) => {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    };

    // Quick database connectivity check
    const { db } = require('./db');
    if (db) {
      db.get('SELECT 1', (err) => {
        if (err) {
          console.error('Health check database error:', err);
          return res.status(503).json({
            status: 'unhealthy',
            error: 'Database connection failed',
            timestamp: new Date().toISOString()
          });
        }
        
        res.status(200).json(healthData);
      });
    } else {
      // Database not initialized yet, but server is running
      res.status(200).json({
        ...healthData,
        note: 'Database not yet initialized'
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
