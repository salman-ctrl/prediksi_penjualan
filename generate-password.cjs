const bcrypt = require('bcrypt');

const password = 'owner12345';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) throw err;
    const laravelHash = hash.replace('$2b$', '$2y$');
    console.log('Hash:', laravelHash);
});