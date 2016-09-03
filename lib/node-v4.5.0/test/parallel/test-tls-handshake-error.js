'use strict';

var assert = require('assert');
var common = require('../common');

if (!common.hasCrypto) {
  common.skip('missing crypto');
  return;
}
var tls = require('tls');

var fs = require('fs');

var errorCount = 0;
var closeCount = 0;

var server = tls.createServer({
  key: fs.readFileSync(common.fixturesDir + '/keys/agent1-key.pem'),
  cert: fs.readFileSync(common.fixturesDir + '/keys/agent1-cert.pem'),
  rejectUnauthorized: true
}, function(c) {
}).listen(0, function() {
  var c = tls.connect({
    port: this.address().port,
    ciphers: 'RC4'
  }, function() {
    assert(false, 'should not be called');
  });

  c.on('error', function(err) {
    errorCount++;
    assert.notEqual(err.code, 'ECONNRESET');
  });

  c.on('close', function(err) {
    if (err)
      closeCount++;
    server.close();
  });
});

process.on('exit', function() {
  assert.equal(errorCount, 1);
  assert.equal(closeCount, 1);
});
