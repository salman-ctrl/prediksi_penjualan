const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { z } = require('zod');
const upload = require('../middleware/upload'); // Import middleware upload

// Validation schemas (Gunakan z.coerce agar aman dengan FormData)
const kategoriSchema = z.object({
  nama_kategori: z.string().min(3, 'Nama kategori minimal 3 karakter')
});

// All routes protected
router.use(protect);

router.get('/', kategoriController.getAllKategori);
router.get('/:id', kategoriController.getKategoriById);

// [UPDATE] Tambahkan upload.single('gambar')
router.post('/', upload.single('gambar'), validate(kategoriSchema), kategoriController.createKategori);
router.put('/:id', upload.single('gambar'), validate(kategoriSchema), kategoriController.updateKategori);

router.delete('/:id', kategoriController.deleteKategori);

module.exports = router;