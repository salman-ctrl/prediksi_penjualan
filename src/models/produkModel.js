const { pool } = require('../config/db');

class ProdukModel {
  /**
   * Get semua produk dengan JOIN kategori
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        p.id_produk,
        p.nama_produk,
        p.deskripsi,
        p.harga,
        p.stok,
        p.created_at,
        p.updated_at,
        k.id_kategori,
        k.nama_kategori
      FROM produk p
      INNER JOIN kategori_produk k ON p.id_kategori = k.id_kategori
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  /**
   * Get produk by ID
   */
  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        p.id_produk,
        p.nama_produk,
        p.deskripsi,
        p.harga,
        p.stok,
        p.created_at,
        p.updated_at,
        k.id_kategori,
        k.nama_kategori
      FROM produk p
      INNER JOIN kategori_produk k ON p.id_kategori = k.id_kategori
      WHERE p.id_produk = ?
    `, [id]);
    return rows[0] || null;
  }

  /**
   * Create produk baru
   */
  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO produk (id_kategori, nama_produk, deskripsi, harga, stok) VALUES (?, ?, ?, ?, ?)',
      [data.id_kategori, data.nama_produk, data.deskripsi, data.harga, data.stok]
    );
    return result.insertId;
  }

  /**
   * Update produk
   */
  static async update(id, data) {
    const [result] = await pool.query(
      'UPDATE produk SET id_kategori = ?, nama_produk = ?, deskripsi = ?, harga = ?, stok = ? WHERE id_produk = ?',
      [data.id_kategori, data.nama_produk, data.deskripsi, data.harga, data.stok, id]
    );
    return result.affectedRows;
  }

  /**
   * Delete produk
   */
  static async delete(id) {
    const [result] = await pool.query(
      'DELETE FROM produk WHERE id_produk = ?',
      [id]
    );
    return result.affectedRows;
  }

  /**
   * Update stok produk
   */
  static async updateStok(id, jumlah) {
    const [result] = await pool.query(
      'UPDATE produk SET stok = stok + ? WHERE id_produk = ?',
      [jumlah, id]
    );
    return result.affectedRows;
  }
}

module.exports = ProdukModel;