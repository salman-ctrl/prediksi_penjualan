const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { secret, expiresIn } = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Login admin
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validasi input
    if (!email || !password) {
      return errorResponse(res, 400, 'Email dan password wajib diisi');
    }

    // 2. Cari user berdasarkan email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return errorResponse(res, 401, 'Email atau password salah');
    }

    // 3. Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Email atau password salah');
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn }
    );

    // 5. Return response
    return successResponse(res, 200, 'Login berhasil', {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 500, 'Server error saat login');
  }
};

/**
 * Get profil user yang sedang login
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    return successResponse(res, 200, 'Data user berhasil diambil', {
      user: req.user
    });
  } catch (error) {
    console.error('Get me error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Logout (client-side handle, backend hanya return success)
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  return successResponse(res, 200, 'Logout berhasil');
};