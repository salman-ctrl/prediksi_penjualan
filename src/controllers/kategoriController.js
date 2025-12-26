const KategoriModel = require('../models/kategoriModel');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get semua kategori
 * GET /api/categories
 */
exports.getAllKategori = async (req, res) => {
  try {
    const categories = await KategoriModel.getAll();
    return successResponse(res, 200, 'Data kategori berhasil diambil', { categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Get kategori by ID
 * GET /api/categories/:id
 */
exports.getKategoriById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await KategoriModel.findById(id);
    
    if (!category) {
      return errorResponse(res, 404, 'Kategori tidak ditemukan');
    }

    return successResponse(res, 200, 'Data kategori berhasil diambil', { category });
  } catch (error) {
    console.error('Get category error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Create kategori baru
 * POST /api/categories
 */
exports.createKategori = async (req, res) => {
  try {
    const { nama_kategori } = req.body;
    
    const insertId = await KategoriModel.create({ nama_kategori });
    const category = await KategoriModel.findById(insertId);

    return successResponse(res, 201, 'Kategori berhasil ditambahkan', { category });
  } catch (error) {
    console.error('Create category error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Update kategori
 * PUT /api/categories/:id
 */
exports.updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kategori } = req.body;

    const category = await KategoriModel.findById(id);
    if (!category) {
      return errorResponse(res, 404, 'Kategori tidak ditemukan');
    }

    await KategoriModel.update(id, { nama_kategori });
    const updatedCategory = await KategoriModel.findById(id);

    return successResponse(res, 200, 'Kategori berhasil diupdate', { category: updatedCategory });
  } catch (error) {
    console.error('Update category error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Delete kategori
 * DELETE /api/categories/:id
 */
exports.deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await KategoriModel.findById(id);
    if (!category) {
      return errorResponse(res, 404, 'Kategori tidak ditemukan');
    }

    await KategoriModel.delete(id);
    return successResponse(res, 200, 'Kategori berhasil dihapus');
  } catch (error) {
    console.error('Delete category error:', error);
    
    // Handle foreign key constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return errorResponse(res, 400, 'Kategori tidak dapat dihapus karena masih digunakan oleh produk');
    }
    
    return errorResponse(res, 500, 'Server error');
  }
};