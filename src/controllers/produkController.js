const ProdukModel = require('../models/produkModel');
const KategoriModel = require('../models/kategoriModel');
const { successResponse, errorResponse } = require('../utils/response');


exports.getAllProduk = async (req, res) => {
  try {
    const { search, category_id } = req.query;
    const products = await ProdukModel.getAll({ search, category_id });

    const productsWithUrl = products.map(p => ({
      ...p,
      gambar_url: p.gambar_utama || null
    }));

    return successResponse(res, 200, 'Data produk berhasil diambil', { products: productsWithUrl });
  } catch (error) {
    console.error('Get products error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};


exports.getProdukById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProdukModel.findById(id);
    if (!product) return errorResponse(res, 404, 'Produk tidak ditemukan');

    product.gambar_url = product.gambar_utama || null;

    const galeri = await ProdukModel.getFotos(id);
    product.galeri = galeri.map(foto => ({
      ...foto,
      url: foto.url_foto
    }));

    return successResponse(res, 200, 'Data produk berhasil diambil', { product });
  } catch (error) {
    console.error('Get product error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};


exports.createProduk = async (req, res) => {
  try {
    const {
      id_kategori, nama_produk, deskripsi, harga, stok,
      installation_available, installation_price
    } = req.body;

    const gambarUtamaFile = req.files && req.files['gambar'] ? req.files['gambar'][0] : null;
    const galeriFiles = req.files && req.files['galeri'] ? req.files['galeri'] : [];

    const gambar_utama = gambarUtamaFile ? gambarUtamaFile.path : null;

    const kategori = await KategoriModel.findById(id_kategori);
    if (!kategori) return errorResponse(res, 404, 'Kategori tidak ditemukan');

    const insertId = await ProdukModel.create({
      id_kategori,
      nama_produk,
      deskripsi,
      harga,
      stok,
      gambar_utama,
      installation_available: parseInt(installation_available) || 0,
      installation_price: parseFloat(installation_price) || 0
    });

    if (galeriFiles.length > 0) {
      const promises = galeriFiles.map(file => ProdukModel.addFoto(insertId, file.path));
      await Promise.all(promises);
    }

    const product = await ProdukModel.findById(insertId);
    return successResponse(res, 201, 'Produk berhasil ditambahkan', { product });
  } catch (error) {
    console.error('Create product error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};


exports.updateProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_kategori, nama_produk, deskripsi, harga, stok,
      installation_available, installation_price
    } = req.body;

    const product = await ProdukModel.findById(id);
    if (!product) return errorResponse(res, 404, 'Produk tidak ditemukan');

    const gambarUtamaFile = req.files && req.files['gambar'] ? req.files['gambar'][0] : null;
    const galeriFiles = req.files && req.files['galeri'] ? req.files['galeri'] : [];

    let gambar_utama_path = product.gambar_utama;
    if (gambarUtamaFile) {
      gambar_utama_path = gambarUtamaFile.path;
    }

    await ProdukModel.update(id, {
      id_kategori, nama_produk, deskripsi, harga, stok,
      gambar_utama: gambar_utama_path,
      installation_available: parseInt(installation_available) || 0,
      installation_price: parseFloat(installation_price) || 0
    });

    if (galeriFiles.length > 0) {
      const promises = galeriFiles.map(file => ProdukModel.addFoto(id, file.path));
      await Promise.all(promises);
    }

    const updatedProduct = await ProdukModel.findById(id);
    return successResponse(res, 200, 'Produk berhasil diupdate', { product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};


exports.deleteProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProdukModel.findById(id);
    if (!product) return errorResponse(res, 404, 'Produk tidak ditemukan');

    await ProdukModel.delete(id);

    return successResponse(res, 200, 'Produk berhasil dihapus');
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return errorResponse(res, 400, 'Produk tidak dapat dihapus karena masih terkait dengan data transaksi');
    }
    return errorResponse(res, 500, 'Server error');
  }
};


exports.deleteFotoGaleri = async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await ProdukModel.findFotoById(id);
    if (!foto) return errorResponse(res, 404, 'Foto tidak ditemukan');

    await ProdukModel.deleteFoto(id);
    return successResponse(res, 200, 'Foto galeri berhasil dihapus');
  } catch (error) {
    console.error('Delete gallery error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};


exports.getAllKategori = async (req, res) => {
  try {
    const categories = await ProdukModel.getAllCategories();
    return successResponse(res, 200, 'Data kategori berhasil diambil', { categories });
  } catch (error) {
    return errorResponse(res, 500, 'Server error');
  }
};


// ✅ CONTROLLER BARU: Tren penjualan per produk per tanggal
exports.getProductTrend = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const start = start_date || '2020-01-01';
    const end = end_date || new Date().toISOString().split('T')[0];

    const data = await ProdukModel.getProductTrend(start, end);
    return successResponse(res, 200, 'Data tren produk berhasil diambil', { data });
  } catch (error) {
    console.error('Get product trend error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};