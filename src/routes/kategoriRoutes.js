const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { z } = require('zod');

// Validation schemas
const kategoriSchema = z.object({
  nama_kategori: z.string().min(3, 'Nama kategori minimal 3 karakter')
});

// All routes protected
router.use(protect);

router.get('/', kategoriController.getAllKategori);
router.get('/:id', kategoriController.getKategoriById);
router.post('/', validate(kategoriSchema), kategoriController.createKategori);
router.put('/:id', validate(kategoriSchema), kategoriController.updateKategori);
router.delete('/:id', kategoriController.deleteKategori);

module.exports = router;