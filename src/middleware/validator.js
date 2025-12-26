const { z } = require('zod');
const { errorResponse } = require('../utils/response');

/**
 * Middleware untuk validasi request menggunakan Zod
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return errorResponse(res, 400, 'Validasi gagal', errors);
      }
      return errorResponse(res, 500, 'Validation error');
    }
  };
};

module.exports = { validate };