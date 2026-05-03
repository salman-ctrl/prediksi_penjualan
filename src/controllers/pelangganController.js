const PelangganModel = require('../models/pelangganModel');
const { successResponse, errorResponse } = require('../utils/response');

exports.getAllPelanggan = async (req, res) => {
  try {
    const customers = await PelangganModel.getAll();

    const formattedCustomers = customers.map(c => ({
      id_pelanggan: c.id_pelanggan,
      nama: c.nama,
      email: c.email,
      no_hp: '-',
      alamat: '-',
      tanggal_daftar: c.tanggal_daftar
    }));

    return successResponse(res, 200, 'Data pelanggan berhasil diambil', { customers: formattedCustomers });
  } catch (error) {
    console.error('Get customers error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.getPelangganById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerRaw = await PelangganModel.findById(id);

    if (!customerRaw) {
      return errorResponse(res, 404, 'Pelanggan tidak ditemukan');
    }

    const customer = {
      id_pelanggan: customerRaw.id_pelanggan,
      nama: customerRaw.nama,
      email: customerRaw.email,
      no_hp: '-',
      alamat: '-',
      tanggal_daftar: customerRaw.tanggal_daftar
    };

    return successResponse(res, 200, 'Data pelanggan berhasil diambil', { customer });
  } catch (error) {
    console.error('Get customer error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.getCustomerStats = async (req, res) => {
  try {
    const stats = await PelangganModel.getStats();
    return successResponse(res, 200, 'Statistik pelanggan berhasil diambil', { stats });
  } catch (error) {
    console.error('Get customer stats error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};