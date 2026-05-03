const bcrypt = require('bcryptjs');

const passwordAsli = 'admin123';
const hash = bcrypt.hashSync(passwordAsli, 10);

console.log('Hash baru:', hash);
console.log(
    'Compare admin123:',
    bcrypt.compareSync('admin123', hash)
);
console.log(
    'Compare salah:',
    bcrypt.compareSync('salah', hash)
);
