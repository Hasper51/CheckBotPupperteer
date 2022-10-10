const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config()
const algorithm = 'aes-256-cbc';
const secretKey = process.env.secretKey
const iv = process.env.iv
const encrypt = (text) => {
    
    // const iv1 = crypto.randomBytes(16);
    // const secretKey1 = crypto.randomBytes(32);
    
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    
    return encrypted.toString('hex')
    
};

const decrypt = (hash) => {

    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv));

    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);

    return decrpyted.toString();
};



module.exports = {
    encrypt,
    decrypt
};