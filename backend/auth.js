// Express routes for login and registration
const express = require('express');
const router = express.Router();
const { initDB, addUser, findUser, verifyPassword } = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

initDB();

// Registration endpoint (temporarily enabled for testing)
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  
  // Check if user already exists
  findUser(username, (err, existingUser) => {
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });
    
    // Create new user
    addUser(username, password, email, (err, userId) => {
      if (err) return res.status(500).json({ error: 'Failed to create user' });
      res.json({ message: 'User created successfully', userId });
    });
  });
});

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  findUser(username, (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!verifyPassword(user, password)) return res.status(401).json({ error: 'Invalid credentials' });
    // Issue JWT
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  });
});

// Middleware to verify JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Protected route to get user info
router.get('/me', authenticateJWT, (req, res) => {
  findUser(req.user.username, (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, email: user.email, created_at: user.created_at });
  });
});

module.exports = router;
