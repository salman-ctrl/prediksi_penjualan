const { pool } = require('../config/db');

class KategoriModel {
  /**
   * Get semua kategori (Standard English Schema)
   */
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        k.id,
        k.name,
        k.parent_id,
        k.image, 
        k.created_at,
        k.updated_at,
        (SELECT COUNT(*) FROM categories WHERE parent_id = k.id) as children_count,
        (SELECT COUNT(*) FROM products WHERE category_id = k.id) as products_count
      FROM categories k
    `;

    const params = [];
    const whereClauses = [];

    if (filters.parent_id === 'null' || filters.is_root) {
      whereClauses.push('k.parent_id IS NULL');
    } else if (filters.parent_id) {
      whereClauses.push('k.parent_id = ?');
      params.push(filters.parent_id);
    }

    if (filters.search) {
      whereClauses.push('k.name LIKE ?');
      params.push(`%${filters.search}%`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY k.name ASC';

    const [rows] = await pool.query(query, params);
    // Kita tetap return alias agar Frontend React tidak perlu diubah masif
    return rows.map(r => ({
      ...r,
      id_kategori: r.id,
      nama_kategori: r.name,
      gambar: r.image
    }));
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        k.*,
        p.name as parent_name
      FROM categories k
      LEFT JOIN categories p ON k.parent_id = p.id
      WHERE k.id = ?
    `, [id]);

    if (!rows[0]) return null;

    return {
      ...rows[0],
      id_kategori: rows[0].id,
      nama_kategori: rows[0].name,
      gambar: rows[0].image
    };
  }

  static async create(data) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, parent_id, image, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [data.nama_kategori, data.parent_id || null, data.gambar]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const [result] = await pool.query(
      'UPDATE categories SET name = ?, parent_id = ?, image = ?, updated_at = NOW() WHERE id = ?',
      [data.nama_kategori, data.parent_id || null, data.gambar, id]
    );
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = KategoriModel;