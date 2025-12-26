const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes protected
router.use(protect);

router.get('/', userController.getAllUsers);

module.exports = router;