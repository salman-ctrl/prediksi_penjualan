const { pool } = require('../config/db');

class PelangganModel {
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        id AS id_pelanggan,
        name AS nama,
        email,
        created_at AS tanggal_daftar
      FROM users 
      WHERE role = 'user'
      ORDER BY created_at DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        id AS id_pelanggan,
        name AS nama,
        email,
        created_at AS tanggal_daftar
      FROM users 
      WHERE id = ? AND role = 'user'
    `, [id]);
    return rows[0] || null;
  }

  static async getStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_pelanggan,
        COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) AS pelanggan_baru_30_hari
      FROM users
      WHERE role = 'user'
    `);
    return stats[0];
  }
}

module.exports = PelangganModel;