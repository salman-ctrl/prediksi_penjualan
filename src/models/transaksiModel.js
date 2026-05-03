const { pool } = require('../config/db');

class TransaksiModel {
  /**
   * Get semua transaksi (Header)
   */
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        t.id AS id_transaksi,
        t.order_code,
        t.notes,
        t.created_at AS tanggal_transaksi,
        t.total_price AS total_harga,
        CASE 
            WHEN t.status = 'paid' THEN 'Paid'
            WHEN t.status = 'pending' THEN 'Unpaid'
            WHEN t.status = 'failed' THEN 'Cancelled'
            ELSE t.status 
        END AS status_pembayaran,
        u.id AS id_pelanggan,
        u.name AS nama_pelanggan,
        u.email AS email_pelanggan
      FROM transactions t
      INNER JOIN users u ON t.user_id = u.id
      WHERE t.status != 'failed'
    `;

    const params = [];
    if (filters.start_date) {
      query += ' AND DATE(t.created_at) >= ?';
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      query += ' AND DATE(t.created_at) <= ?';
      params.push(filters.end_date);
    }
    if (filters.status_pembayaran) {
      query += ' AND t.status = ?';
      params.push(filters.status_pembayaran.toLowerCase());
    }

    query += ' ORDER BY t.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Get detail transaksi by ID
   * Diperbarui untuk mengambil: notes, design_cost, design_difficulty, product_image, dan jasa pasang
   */
  static async findById(id) {
    const [transaksi] = await pool.query(`
      SELECT 
        t.id AS id_transaksi,
        t.order_code,
        t.notes,
        t.created_at AS tanggal_transaksi,
        t.total_price AS total_harga,
        CASE 
            WHEN t.status = 'paid' THEN 'Paid' 
            WHEN t.status = 'pending' THEN 'Unpaid'
            ELSE 'Cancelled'
        END AS status_pembayaran,
        u.id AS id_pelanggan,
        u.name AS nama_pelanggan,
        u.email AS email_pelanggan
      FROM transactions t
      INNER JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [id]);

    if (transaksi.length === 0) return null;

    const [details] = await pool.query(`
      SELECT 
        td.id AS id_detail,
        td.quantity AS jumlah,
        td.price AS harga_satuan,
        td.subtotal,
        td.design_option,
        td.design_difficulty,
        td.design_cost,
        td.design_file, 
        td.need_installation,   -- [TAMBAHAN]
        td.installation_price, -- [TAMBAHAN]
        p.name AS product_name,
        p.image_primary AS product_image,
        ps.material,
        ps.size,
        ps.finishing
      FROM transaction_details td
      INNER JOIN product_specifications ps ON td.product_specification_id = ps.id
      INNER JOIN products p ON ps.product_id = p.id
      WHERE td.transaction_id = ?
    `, [id]);

    return { ...transaksi[0], items: details };
  }

  /**
   * Get Penjualan Mingguan (UNTUK GRAFIK & ARIMA)
   */
  static async getWeeklySales(startDate, endDate) {
    const [rows] = await pool.query(`
      SELECT 
        DATE_FORMAT(MIN(created_at), '%Y-%m-%d') AS tanggal,
        YEARWEEK(created_at, 1) AS minggu,
        SUM(total_price) AS total_penjualan,
        COUNT(*) AS jumlah_transaksi
      FROM transactions
      WHERE status = 'paid'
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY YEARWEEK(created_at, 1)
      ORDER BY MIN(created_at) ASC
    `, [startDate, endDate]);

    return rows;
  }

  /**
   * Get Statistik Dashboard
   */
  static async getDashboardStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_transaksi,
        SUM(CASE WHEN status = 'paid' THEN total_price ELSE 0 END) AS total_pendapatan,
        AVG(CASE WHEN status = 'paid' THEN total_price ELSE NULL END) AS rata_rata_transaksi,
        SUM(CASE WHEN DATE(created_at) = CURDATE() AND status = 'paid' THEN total_price ELSE 0 END) AS pendapatan_hari_ini
      FROM transactions
      WHERE status != 'failed'
    `);
    return stats[0];
  }

  /**
   * Get Produk Terlaris
   */
  static async getTopProducts(limit = 100) {
    const [rows] = await pool.query(`
      SELECT 
        p.name AS nama_produk,
        SUM(td.quantity) AS total_terjual
      FROM transaction_details td
      INNER JOIN transactions t ON td.transaction_id = t.id
      INNER JOIN product_specifications ps ON td.product_specification_id = ps.id
      INNER JOIN products p ON ps.product_id = p.id
      WHERE t.status = 'paid'
      GROUP BY p.id, p.name
      ORDER BY total_terjual DESC
      LIMIT ?
    `, [Number(limit)]);
    return rows;
  }

  /**
   * Hapus transaksi (Ubah status jadi failed/cancelled)
   */
  static async softDelete(id) {
    const [result] = await pool.query("UPDATE transactions SET status = 'failed' WHERE id = ?", [id]);
    return result.affectedRows;
  }
}

module.exports = TransaksiModel;