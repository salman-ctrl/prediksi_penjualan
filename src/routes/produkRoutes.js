const express = require('express');
const router = express.Router();
const produkController = require('../controllers/produkController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { z } = require('zod');

// Validation schemas
const produkSchema = z.object({
  id_kategori: z.number().positive('ID kategori tidak valid'),
  nama_produk: z.string().min(3, 'Nama produk minimal 3 karakter'),
  deskripsi: z.string().optional(),
  harga: z.number().positive('Harga harus lebih dari 0'),
  stok: z.number().int().min(0, 'Stok tidak boleh negatif')
});

// All routes protected
router.use(protect);

router.get('/', produkController.getAllProduk);
router.get('/:id', produkController.getProdukById);
router.post('/', validate(produkSchema), produkController.createProduk);
router.put('/:id', validate(produkSchema), produkController.updateProduk);
router.delete('/:id', produkController.deleteProduk);

module.exports = router;