import bcrypt from 'bcrypt';
const pass = 'Kazanova54321@';
const vault = 'Kazanova54321$';
console.log('ADMIN_PASS_HASH=' + bcrypt.hashSync(pass, 10));
console.log('VAULT_PASS_HASH=' + bcrypt.hashSync(vault, 10));
