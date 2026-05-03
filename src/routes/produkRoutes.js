const express = require('express');
const router = express.Router();
const produkController = require('../controllers/produkController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { z } = require('zod');
const upload = require('../middleware/upload');

const produkSchema = z.object({
  id_kategori: z.coerce.number().positive('ID kategori tidak valid'),
  nama_produk: z.string().min(3, 'Nama produk minimal 3 karakter'),
  deskripsi: z.string().optional().nullable(),
  harga: z.coerce.number().nonnegative('Harga tidak boleh negatif'),
  stok: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  installation_available: z.coerce.number().min(0).max(1).optional().default(0),
  installation_price: z.coerce.number().nonnegative('Biaya pasang tidak boleh negatif').optional().default(0)
});

router.use(protect);

router.get('/categories', produkController.getAllKategori);

router.get('/trend', produkController.getProductTrend);

router.get('/', produkController.getAllProduk);
router.get('/:id', produkController.getProdukById);

const uploadFields = upload.fields([
  { name: 'gambar', maxCount: 1 },
  { name: 'galeri', maxCount: 5 }
]);

router.post('/', uploadFields, validate(produkSchema), produkController.createProduk);
router.put('/:id', uploadFields, validate(produkSchema), produkController.updateProduk);

router.delete('/gallery/:id', produkController.deleteFotoGaleri);
router.delete('/:id', produkController.deleteProduk);

module.exports = router;