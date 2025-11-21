const { query } = require('../db/connection');
const bcrypt = require('bcryptjs');

/**
 * User model for authentication
 */
class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.role = data.role;
    this.createdAt = data.created_at;
  }

  /**
   * Create a new user
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @param {string} role - User role (teacher or student)
   * @returns {Promise<User>}
   */
  static async create(email, password, role) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, role]
    );

    return new User(result.rows[0]);
  }

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  /**
   * Find user by ID
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  /**
   * Verify password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<User|null>}
   */
  static async verifyPassword(email, password) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    return new User(user);
  }
}

module.exports = User;
