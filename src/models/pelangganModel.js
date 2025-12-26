const { pool } = require('../config/db');

class PelangganModel {
  /**
   * Get semua pelanggan (READ ONLY)
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        id_pelanggan,
        nama,
        email,
        alamat,
        no_hp,
        tanggal_daftar
      FROM pelanggan
      ORDER BY tanggal_daftar DESC
    `);
    return rows;
  }

  /**
   * Get pelanggan by ID
   */
  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        id_pelanggan,
        nama,
        email,
        alamat,
        no_hp,
        tanggal_daftar
      FROM pelanggan
      WHERE id_pelanggan = ?
    `, [id]);
    return rows[0] || null;
  }

  /**
   * Get statistik pelanggan
   */
  static async getStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_pelanggan,
        COUNT(CASE WHEN DATE(tanggal_daftar) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) AS pelanggan_baru_30_hari
      FROM pelanggan
    `);
    return stats[0];
  }
}

module.exports = PelangganModel;