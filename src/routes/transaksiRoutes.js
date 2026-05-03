const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');
const { protect } = require('../middleware/auth');

// All routes protected
router.use(protect);

// Stats routes (harus di atas /:id)
router.get('/stats/dashboard', transaksiController.getDashboardStats);
router.get('/sales/weekly', transaksiController.getWeeklySales);
router.get('/products/top', transaksiController.getTopProducts); // ← TAMBAH INI


// CRUD routes
router.get('/', transaksiController.getAllTransaksi);
router.get('/:id', transaksiController.getTransaksiById);
router.delete('/:id', transaksiController.deleteTransaksi);

module.exports = router;