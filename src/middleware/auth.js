const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');
const { errorResponse } = require('../utils/response');
const UserModel = require('../models/userModel');

/**
 * Middleware untuk proteksi route dengan JWT
 */
const protect = async (req, res, next) => {
  try {
    // 1. Cek header Authorization
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Unauthorized - Token tidak ditemukan');
    }

    // 2. Verifikasi token
    const decoded = jwt.verify(token, secret);

    // 3. Cek user masih ada di database
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 401, 'User tidak ditemukan');
    }

    // 4. Attach user ke request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Token tidak valid');
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token sudah expired');
    }
    return errorResponse(res, 500, 'Server error pada autentikasi');
  }
};

module.exports = { protect };