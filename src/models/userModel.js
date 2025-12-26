const { pool } = require('../config/db');

class UserModel {
  /**
   * Cari user berdasarkan email
   */
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  /**
   * Cari user berdasarkan ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Get semua users (untuk admin)
   */
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }
}

module.exports = UserModel;