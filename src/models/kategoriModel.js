const { pool } = require('../config/db');

class KategoriModel {
  /**
   * Get semua kategori
   */
  static async getAll() {
    const [rows] = await pool.query(
      'SELECT * FROM kategori_produk ORDER BY nama_kategori ASC'
    );
    return rows;
  }

  /**
   * Get kategori by ID
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM kategori_produk WHERE id_kategori = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Create kategori baru
   */
  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO kategori_produk (nama_kategori) VALUES (?)',
      [data.nama_kategori]
    );
    return result.insertId;
  }

  /**
   * Update kategori
   */
  static async update(id, data) {
    const [result] = await pool.query(
      'UPDATE kategori_produk SET nama_kategori = ? WHERE id_kategori = ?',
      [data.nama_kategori, id]
    );
    return result.affectedRows;
  }

  /**
   * Delete kategori
   */
  static async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM kategori_produk WHERE id_kategori = ?',
      [id]
    );
    return result.affectedRows;
  }
}

module.exports = KategoriModel;