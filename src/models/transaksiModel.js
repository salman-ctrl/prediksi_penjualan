const { pool } = require('../config/db');

class TransaksiModel {
  /**
   * Get semua transaksi (exclude soft deleted)
   */
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        t.id_transaksi,
        t.tanggal_transaksi,
        t.total_harga,
        t.status_pembayaran,
        t.status_pesanan,
        p.id_pelanggan,
        p.nama AS nama_pelanggan,
        p.email AS email_pelanggan,
        p.no_hp
      FROM transaksi t
      INNER JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
      WHERE t.deleted_at IS NULL
    `;

    const params = [];

    // Filter by date range
    if (filters.start_date) {
      query += ' AND t.tanggal_transaksi >= ?';
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      query += ' AND t.tanggal_transaksi <= ?';
      params.push(filters.end_date);
    }

    // Filter by status
    if (filters.status_pembayaran) {
      query += ' AND t.status_pembayaran = ?';
      params.push(filters.status_pembayaran);
    }

    query += ' ORDER BY t.tanggal_transaksi DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Get transaksi by ID dengan detail
   */
  static async findById(id) {
    // Get transaksi header
    const [transaksi] = await pool.query(`
      SELECT 
        t.id_transaksi,
        t.tanggal_transaksi,
        t.total_harga,
        t.status_pembayaran,
        t.status_pesanan,
        t.created_at,
        p.id_pelanggan,
        p.nama AS nama_pelanggan,
        p.email AS email_pelanggan,
        p.alamat,
        p.no_hp
      FROM transaksi t
      INNER JOIN pelanggan p ON t.id_pelanggan = p.id_pelanggan
      WHERE t.id_transaksi = ? AND t.deleted_at IS NULL
    `, [id]);

    if (transaksi.length === 0) return null;

    // Get detail items
    const [details] = await pool.query(`
      SELECT 
        dt.id_detail,
        dt.jumlah,
        dt.subtotal,
        pr.id_produk,
        pr.nama_produk,
        pr.harga
      FROM detail_transaksi dt
      INNER JOIN produk pr ON dt.id_produk = pr.id_produk
      WHERE dt.id_transaksi = ?
    `, [id]);

    // Get pembayaran
    const [pembayaran] = await pool.query(`
      SELECT 
        id_pembayaran,
        metode_pembayaran,
        jumlah_bayar,
        tanggal_bayar,
        status
      FROM pembayaran
      WHERE id_transaksi = ?
    `, [id]);

    return {
      ...transaksi[0],
      detail_items: details,
      pembayaran: pembayaran[0] || null
    };
  }

  /**
   * Soft delete transaksi
   */
  static async softDelete(id) {
    const [result] = await pool.query(
      'UPDATE transaksi SET deleted_at = NOW() WHERE id_transaksi = ?',
      [id]
    );
    return result.affectedRows;
  }

  /**
   * Get data untuk prediksi (agregasi mingguan)
   */
  static async getWeeklySales(startDate, endDate) {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(tanggal_transaksi, '%Y-%m-%d') AS tanggal,
        YEARWEEK(tanggal_transaksi, 1) AS minggu,
        SUM(total_harga) AS total_penjualan,
        COUNT(*) AS jumlah_transaksi
      FROM transaksi
      WHERE deleted_at IS NULL
        AND status_pembayaran = 'Paid'
        AND tanggal_transaksi BETWEEN ? AND ?
      GROUP BY YEARWEEK(tanggal_transaksi, 1)
      ORDER BY tanggal_transaksi ASC
    `, [startDate, endDate]);
    
    return rows;
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_transaksi,
        SUM(total_harga) AS total_pendapatan,
        AVG(total_harga) AS rata_rata_transaksi,
        SUM(CASE WHEN status_pembayaran = 'Paid' THEN 1 ELSE 0 END) AS transaksi_lunas,
        SUM(CASE WHEN DATE(tanggal_transaksi) = CURDATE() THEN total_harga ELSE 0 END) AS pendapatan_hari_ini
      FROM transaksi
      WHERE deleted_at IS NULL
    `);
    
    return stats[0];
  }
}

module.exports = TransaksiModel;