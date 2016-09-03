'use strict';
var assert = require('assert');
var common = require('../common');

if (!common.hasCrypto) {
  common.skip('missing crypto');
  return;
}
var tls = require('tls');

var fs = require('fs');

var ended = 0;

var server = tls.createServer({
  key: fs.readFileSync(common.fixturesDir + '/keys/agent1-key.pem'),
  cert: fs.readFileSync(common.fixturesDir + '/keys/agent1-cert.pem')
}, function(c) {
  // Send close-notify without shutting down TCP socket
  if (c._handle.shutdownSSL() !== 1)
    c._handle.shutdownSSL();
}).listen(0, function() {
  var c = tls.connect(this.address().port, {
    rejectUnauthorized: false
  }, function() {
    // Ensure that we receive 'end' event anyway
    c.on('end', function() {
      ended++;
      c.destroy();
      server.close();
    });
  });
});

process.on('exit', function() {
  assert.equal(ended, 1);
});
