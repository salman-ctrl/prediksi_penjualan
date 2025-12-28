const ProdukModel = require('../models/produkModel');
const KategoriModel = require('../models/kategoriModel');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get semua produk
 * GET /api/products
 */
exports.getAllProduk = async (req, res) => {
  try {
    const products = await ProdukModel.getAll();
    return successResponse(res, 200, 'Data produk berhasil diambil', { products });
  } catch (error) {
    console.error('Get products error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Get produk by ID
 * GET /api/products/:id
 */
exports.getProdukById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProdukModel.findById(id);
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }

    return successResponse(res, 200, 'Data produk berhasil diambil', { product });
  } catch (error) {
    console.error('Get product error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Create produk baru
 * POST /api/products
 */
exports.createProduk = async (req, res) => {
  try {
    const { id_kategori, nama_produk, deskripsi, harga, stok } = req.body;

    // Validasi kategori exists
    const kategori = await KategoriModel.findById(id_kategori);
    if (!kategori) {
      return errorResponse(res, 404, 'Kategori tidak ditemukan');
    }

    const insertId = await ProdukModel.create({
      id_kategori,
      nama_produk,
      deskripsi,
      harga,
      stok
    });

    const product = await ProdukModel.findById(insertId);
    return successResponse(res, 201, 'Produk berhasil ditambahkan', { product });
  } catch (error) {
    console.error('Create product error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Update produk
 * PUT /api/products/:id
 */
exports.updateProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_kategori, nama_produk, deskripsi, harga, stok } = req.body;

    // Cek produk exists
    const product = await ProdukModel.findById(id);
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }

    // Validasi kategori exists
    const kategori = await KategoriModel.findById(id_kategori);
    if (!kategori) {
      return errorResponse(res, 404, 'Kategori tidak ditemukan');
    }

    await ProdukModel.update(id, {
      id_kategori,
      nama_produk,
      deskripsi,
      harga,
      stok
    });

    const updatedProduct = await ProdukModel.findById(id);
    return successResponse(res, 200, 'Produk berhasil diupdate', { product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Delete produk
 * DELETE /api/products/:id
 */
exports.deleteProduk = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProdukModel.findById(id);
    if (!product) {
      return errorResponse(res, 404, 'Produk ditemukan');
    }

    await ProdukModel.delete(id);
    return successResponse(res, 200, 'Produk berhasil dihapus');
  } catch (error) {
    console.error('Delete product error:', error);
    
    // Handle foreign key constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return errorResponse(res, 400, 'Produk tidak dapat dihapus karena masih ada di transaksi');
    }
    
    return errorResponse(res, 500, 'Server error');
  }
};