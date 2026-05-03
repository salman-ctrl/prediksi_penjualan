const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');
const { errorResponse } = require('../utils/response');
const UserModel = require('../models/userModel');


const protect = async (req, res, next) => {
  try {
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

    const decoded = jwt.verify(token, secret);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 401, 'User tidak ditemukan');
    }

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