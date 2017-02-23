'use strict';
const common = require('../common');
const assert = require('assert');
const crypto = require('crypto');

if (!common.hasCrypto) {
  common.skip('node compiled without OpenSSL.');
  return;
}

assert.throws(function() {
  crypto.getDiffieHellman('unknown-group');
});
assert.throws(function() {
  crypto.getDiffieHellman('modp1').setPrivateKey('');
});
assert.throws(function() {
  crypto.getDiffieHellman('modp1').setPublicKey('');
});

const hashes = {
  modp1: '630e9acd2cc63f7e80d8507624ba60ac0757201a',
  modp2: '18f7aa964484137f57bca64b21917a385b6a0b60',
  modp5: 'c0a8eec0c2c8a5ec2f9c26f9661eb339a010ec61',
  modp14: 'af5455606fe74cec49782bb374e4c63c9b1d132c',
  modp15: '7bdd39e5cdbb9748113933e5c2623b559c534e74',
  modp16: 'daea5277a7ad0116e734a8e0d2f297ef759d1161',
  modp17: '3b62aaf0142c2720f0bf26a9589b0432c00eadc1',
  modp18: 'a870b491bbbec9b131ae9878d07449d32e54f160'
};

for (const name in hashes) {
  const group = crypto.getDiffieHellman(name);
  const private_key = group.getPrime('hex');
  const hash1 = hashes[name];
  const hash2 = crypto.createHash('sha1')
                    .update(private_key.toUpperCase()).digest('hex');
  assert.strictEqual(hash1, hash2);
  assert.strictEqual(group.getGenerator('hex'), '02');
}

for (const name in hashes) {
  // modp1 is 768 bits, FIPS requires >= 1024
  if (name === 'modp1' && common.hasFipsCrypto)
    continue;
  const group1 = crypto.getDiffieHellman(name);
  const group2 = crypto.getDiffieHellman(name);
  group1.generateKeys();
  group2.generateKeys();
  const key1 = group1.computeSecret(group2.getPublicKey());
  const key2 = group2.computeSecret(group1.getPublicKey());
  assert.deepStrictEqual(key1, key2);
}
