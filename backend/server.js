// Main Express server setup
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./auth');
const watchRoutes = require('./routes/watches');
const contactRoutes = require('./routes/contacts');
const leadRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/watches', watchRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/leads', leadRoutes);

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
