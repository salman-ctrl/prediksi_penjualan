const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { z } = require('zod');

// Validation schema
const predictionSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  forecast_steps: z.number().int().min(1).max(12).optional()
});

console.log({
  protectType: typeof protect,
  validateType: typeof validate,
  runPredictionType: typeof predictionController.runPrediction,
});


// Protected route
router.post(
  '/arima',
  protect,
  validate(predictionSchema),
  predictionController.runPrediction
);


router.post('/arima', validate(predictionSchema), predictionController.runPrediction);

module.exports = router;