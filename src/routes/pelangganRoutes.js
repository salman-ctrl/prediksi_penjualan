const express = require('express');
const router = express.Router();
const pelangganController = require('../controllers/pelangganController');
const { protect } = require('../middleware/auth');

// All routes protected
router.use(protect);

// Stats route (harus di atas /:id)
router.get('/stats/summary', pelangganController.getCustomerStats);

// Read-only routes
router.get('/', pelangganController.getAllPelanggan);
router.get('/:id', pelangganController.getPelangganById);

module.exports = router;