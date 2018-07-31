var crypto = require('crypto');

const password = 'xander216';
const salt = '1284kjajsdf##!92839021!!';

var hash = crypto.createHash('sha256');
hash.update(password);
hash.update(salt);


console.log(hash.digest('hex'))