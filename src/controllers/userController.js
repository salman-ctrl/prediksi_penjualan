const UserModel = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get semua users
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.getAll();
    return successResponse(res, 200, 'Data users berhasil diambil', { users });
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse(res, 500, 'Server error saat mengambil data users');
  }
};