require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'anugrah_murni_sejati_secret_key_2026',
  expiresIn: process.env.JWT_EXPIRE || '7d'
};