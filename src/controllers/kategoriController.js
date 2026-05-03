const KategoriModel = require('../models/kategoriModel');
const { successResponse, errorResponse } = require('../utils/response');

// Fungsi hapus file lokal tidak lagi digunakan untuk Cloudinary
const removeFile = (filePath) => {
  console.log("Cloudinary file deletion requires SDK destroy, skipping local unlink.");
};

exports.getAllKategori = async (req, res) => {
  try {
    const { search, parent_id, is_root } = req.query;
    const filters = { search, parent_id, is_root: is_root === 'true' };

    const categories = await KategoriModel.getAll(filters);

    // KARENA CLOUDINARY SUDAH URL LENGKAP:
    // Langsung ambil dari kolom 'gambar' tanpa prefix localhost
    const categoriesWithUrl = categories.map(cat => ({
      ...cat,
      gambar_url: cat.gambar ? cat.gambar : null
    }));

    return successResponse(res, 200, 'Data kategori berhasil diambil', { categories: categoriesWithUrl });
  } catch (error) {
    console.error('Get categories error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.getKategoriById = async (req, res) => {
  try {
    const category = await KategoriModel.findById(req.params.id);
    if (!category) return errorResponse(res, 404, 'Kategori tidak ditemukan');

    // Langsung gunakan path dari database
    if (category.gambar) {
      category.gambar_url = category.gambar;
    }

    return successResponse(res, 200, 'Detail kategori berhasil diambil', { category });
  } catch (error) {
    return errorResponse(res, 500, 'Server error');
  }
};

exports.createKategori = async (req, res) => {
  try {
    const { nama_kategori, parent_id } = req.body;

    // Cloudinary menyimpan URL di req.file.path
    const gambar = req.file ? req.file.path : null;

    const insertId = await KategoriModel.create({
      nama_kategori,
      parent_id: parent_id ? Number(parent_id) : null,
      gambar: gambar
    });

    const category = await KategoriModel.findById(insertId);
    return successResponse(res, 201, 'Kategori berhasil ditambahkan', { category });
  } catch (error) {
    console.error('Create category error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kategori, parent_id } = req.body;

    const category = await KategoriModel.findById(id);
    if (!category) return errorResponse(res, 404, 'Kategori tidak ditemukan');

    let gambarPath = category.gambar;
    if (req.file) {
      // Gunakan URL baru dari Cloudinary
      gambarPath = req.file.path;
    }

    await KategoriModel.update(id, {
      nama_kategori,
      parent_id: parent_id ? Number(parent_id) : null,
      gambar: gambarPath
    });

    return successResponse(res, 200, 'Kategori berhasil diupdate');
  } catch (error) {
    console.error('Update category error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await KategoriModel.findById(id);
    if (!category) return errorResponse(res, 404, 'Kategori tidak ditemukan');

    await KategoriModel.delete(id);
    return successResponse(res, 200, 'Kategori berhasil dihapus');
  } catch (error) {
    console.error('Delete category error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};