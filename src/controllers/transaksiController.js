const TransaksiModel = require('../models/transaksiModel');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get semua transaksi
 * GET /api/transactions
 */
exports.getAllTransaksi = async (req, res) => {
  try {
    const { start_date, end_date, status_pembayaran } = req.query;
    
    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (status_pembayaran) filters.status_pembayaran = status_pembayaran;

    const transactions = await TransaksiModel.getAll(filters);
    
    return successResponse(res, 200, 'Data transaksi berhasil diambil', { 
      transactions,
      total: transactions.length 
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Get transaksi by ID (dengan detail)
 * GET /api/transactions/:id
 */
exports.getTransaksiById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await TransaksiModel.findById(id);
    
    if (!transaction) {
      return errorResponse(res, 404, 'Transaksi tidak ditemukan');
    }

    return successResponse(res, 200, 'Data transaksi berhasil diambil', { transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Soft delete transaksi
 * DELETE /api/transactions/:id
 */
exports.deleteTransaksi = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await TransaksiModel.findById(id);
    if (!transaction) {
      return errorResponse(res, 404, 'Transaksi tidak ditemukan');
    }

    await TransaksiModel.softDelete(id);
    return successResponse(res, 200, 'Transaksi berhasil dihapus (soft delete)');
  } catch (error) {
    console.error('Delete transaction error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Get dashboard statistics
 * GET /api/transactions/stats/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await TransaksiModel.getDashboardStats();
    return successResponse(res, 200, 'Statistik dashboard berhasil diambil', { stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Get data untuk prediksi (weekly sales)
 * GET /api/transactions/sales/weekly
 */
exports.getWeeklySales = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return errorResponse(res, 400, 'Parameter start_date dan end_date wajib diisi');
    }

    const weeklySales = await TransaksiModel.getWeeklySales(start_date, end_date);
    
    return successResponse(res, 200, 'Data penjualan mingguan berhasil diambil', { 
      data: weeklySales,
      total_weeks: weeklySales.length
    });
  } catch (error) {
    console.error('Get weekly sales error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};