const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => res.json({ message: 'Auth route working' }));

// Login route using proper JWT authentication
router.post('/login', async (req, res) => {
  console.log('DEBUG ROUTES - Login route called directly');
  const authController = require('../controllers/authController');
  return authController.login(req, res);
});

// Test route for JWT login
router.post('/login2', async (req, res) => {
  console.log('DEBUG ROUTES - Login2 route called');
  const authController = require('../controllers/authController');
  return authController.login(req, res);
});

console.log('DEBUG ROUTES - Auth routes loaded');

module.exports = router;