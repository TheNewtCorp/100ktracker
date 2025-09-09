// Main Express server setup
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./auth');
const watchRoutes = require('./routes/watches');
const contactRoutes = require('./routes/contacts');
const leadRoutes = require('./routes/leads');
const invoiceRoutes = require('./routes/invoices-safe'); // Safe version without Stripe
const accountRoutes = require('./routes/account');
const webhookRoutes = require('./routes/webhooks'); // Step 5: Webhook integration

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());

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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
