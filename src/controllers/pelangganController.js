const PelangganModel = require('../models/pelangganModel');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get semua pelanggan
 * GET /api/customers
 */
exports.getAllPelanggan = async (req, res) => {
  try {
    const customers = await PelangganModel.getAll();
    return successResponse(res, 200, 'Data pelanggan berhasil diambil', { customers });
  } catch (error) {
    console.error('Get customers error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Get pelanggan by ID
 * GET /api/customers/:id
 */
exports.getPelangganById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await PelangganModel.findById(id);
    
    if (!customer) {
      return errorResponse(res, 404, 'Pelanggan tidak ditemukan');
    }

    return successResponse(res, 200, 'Data pelanggan berhasil diambil', { customer });
  } catch (error) {
    console.error('Get customer error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Get statistik pelanggan
 * GET /api/customers/stats/summary
 */
exports.getCustomerStats = async (req, res) => {
  try {
    const stats = await PelangganModel.getStats();
    return successResponse(res, 200, 'Statistik pelanggan berhasil diambil', { stats });
  } catch (error) {
    console.error('Get customer stats error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};