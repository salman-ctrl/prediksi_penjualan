const { pool } = require('../config/db');

class ProdukModel {

  static async getAll(filters = {}) {
    let query = `
      SELECT 
        p.id AS id_produk,
        p.name AS nama_produk,
        p.description AS deskripsi,
        p.image_primary AS gambar_utama,
        p.category_id AS id_kategori,
        p.installation_available,
        p.installation_price,
        p.created_at,
        p.updated_at,
        c.name AS nama_kategori,
        (SELECT MIN(harga) FROM product_specifications WHERE product_id = p.id) as harga,
        100 as stok
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;

    const params = [];
    const whereClauses = [];

    if (filters.category_id) {
      whereClauses.push('p.category_id = ?');
      params.push(filters.category_id);
    }

    if (filters.search) {
      whereClauses.push('p.name LIKE ?');
      params.push(`%${filters.search}%`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        p.id AS id_produk,
        p.name AS nama_produk,
        p.description AS deskripsi,
        p.image_primary AS gambar_utama,
        p.category_id AS id_kategori,
        p.installation_available,
        p.installation_price,
        c.name AS nama_kategori,
        p.created_at,
        p.updated_at,
        (SELECT MIN(harga) FROM product_specifications WHERE product_id = p.id) as harga,
        100 as stok
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const [specs] = await pool.query(
      'SELECT id, material, size, finishing, harga FROM product_specifications WHERE product_id = ?',
      [id]
    );

    return {
      ...rows[0],
      spesifikasi: specs
    };
  }

  static async create(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [resProd] = await connection.query(
        `INSERT INTO products 
        (category_id, name, description, image_primary, installation_available, installation_price, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.id_kategori,
          data.nama_produk,
          data.deskripsi,
          data.gambar_utama,
          data.installation_available || 0,
          data.installation_price || 0
        ]
      );
      const productId = resProd.insertId;

      await connection.query(
        `INSERT INTO product_specifications 
        (product_id, material, size, finishing, harga, kualitas_warna, daya_tahan, tekstur_bahan, ukuran_cetak, created_at, updated_at) 
        VALUES (?, 'Standard', 'Standard', 'None', ?, 3, 3, 3, 3, NOW(), NOW())`,
        [productId, data.harga]
      );

      await connection.commit();
      return productId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(id, data) {
    const [result] = await pool.query(
      `UPDATE products SET 
        category_id=?, 
        name=?, 
        description=?, 
        image_primary=?, 
        installation_available=?,
        installation_price=?,
        updated_at=NOW() 
      WHERE id=?`,
      [
        data.id_kategori,
        data.nama_produk,
        data.deskripsi,
        data.gambar_utama,
        data.installation_available || 0,
        data.installation_price || 0,
        id
      ]
    );

    if (data.harga) {
      await pool.query('UPDATE product_specifications SET harga = ? WHERE product_id = ?', [data.harga, id]);
    }

    return result.affectedRows;
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM product_specifications WHERE product_id = ?', [id]);
      await connection.query('DELETE FROM product_photos WHERE product_id = ?', [id]);

      const [result] = await connection.query('DELETE FROM products WHERE id = ?', [id]);

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateStok(id, jumlah) {
    return 1;
  }

  static async getAllCategories() {
    const [rows] = await pool.query(
      'SELECT id AS id_kategori, name AS nama_kategori, parent_id FROM categories ORDER BY name ASC'
    );
    return rows;
  }

  static async addFoto(id_produk, url_foto) {
    const [result] = await pool.query(
      'INSERT INTO product_photos (product_id, photo_url, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [id_produk, url_foto]
    );
    return result.insertId;
  }

  static async getFotos(id_produk) {
    const [rows] = await pool.query(
      'SELECT id AS id_foto, photo_url AS url_foto FROM product_photos WHERE product_id = ?',
      [id_produk]
    );
    return rows;
  }

  static async deleteFoto(id_foto) {
    const [result] = await pool.query(
      'DELETE FROM product_photos WHERE id = ?',
      [id_foto]
    );
    return result.affectedRows;
  }

  static async findFotoById(id_foto) {
    const [rows] = await pool.query(
      'SELECT id AS id_foto, photo_url AS url_foto FROM product_photos WHERE id = ?',
      [id_foto]
    );
    return rows[0];
  }

  static async getProductTrend(start_date, end_date) {
    const [rows] = await pool.query(`
      SELECT 
        p.name AS product_name,
        DATE_FORMAT(DATE(t.created_at), '%Y-%m-%d') AS date,
        SUM(td.quantity) AS total
      FROM transaction_details td
      JOIN product_specifications ps ON td.product_specification_id = ps.id
      JOIN products p ON ps.product_id = p.id
      JOIN transactions t ON td.transaction_id = t.id
      WHERE t.created_at BETWEEN ? AND ?
        AND t.status = 'paid'
      GROUP BY p.name, DATE(t.created_at), DATE_FORMAT(DATE(t.created_at), '%Y-%m-%d')
      ORDER BY date ASC
    `, [start_date, end_date]);

    return rows;
  }
}

module.exports = ProdukModel;