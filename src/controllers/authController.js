const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { secret, expiresIn } = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/response');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email dan password wajib diisi');
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return errorResponse(res, 401, 'Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Email atau password salah');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn }
    );

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

exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return errorResponse(res, 404, 'User tidak ditemukan');
    }
    return successResponse(res, 200, 'Data user berhasil diambil', {
      user: req.user
    });
  } catch (error) {
    console.error('Get me error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

exports.logout = async (req, res) => {
  return successResponse(res, 200, 'Logout berhasil');
};