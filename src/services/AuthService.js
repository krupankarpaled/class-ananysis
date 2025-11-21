const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * Authentication service for user login, token generation, and verification
 */
class AuthService {
  /**
   * Login user and generate JWT token
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user: Object, expiresIn: number}>}
   */
  static async login(email, password) {
    const user = await User.verifyPassword(email, password);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    };
  }

  /**
   * Generate JWT token for user
   * @param {User} user
   * @returns {string}
   */
  static generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verify JWT token and return payload
   * @param {string} token
   * @returns {Promise<Object>}
   */
  static async verifyToken(token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Create a new user
   * @param {string} email
   * @param {string} password
   * @param {string} role
   * @returns {Promise<User>}
   */
  static async createUser(email, password, role) {
    return await User.create(email, password, role);
  }

  /**
   * Logout (token invalidation would require a token blacklist in production)
   * @param {string} token
   * @returns {Promise<void>}
   */
  static async logout(token) {
    // In a production system, you would add the token to a blacklist/revocation list
    // For now, we rely on client-side token removal
    return;
  }
}

module.exports = AuthService;
