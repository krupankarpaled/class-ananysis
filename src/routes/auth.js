const express = require('express');
const AuthService = require('../services/AuthService');

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await AuthService.login(email, password);
    
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Role must be teacher or student' });
    }

    const user = await AuthService.createUser(email, password, role);
    
    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('duplicate key')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (invalidate token)
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await AuthService.logout(token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
