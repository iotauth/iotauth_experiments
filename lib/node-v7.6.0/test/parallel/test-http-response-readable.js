'use strict';
require('../common');
const assert = require('assert');
const http = require('http');

const testServer = new http.Server(function(req, res) {
  res.writeHead(200);
  res.end('Hello world');
});

testServer.listen(0, function() {
  http.get({ port: this.address().port }, function(res) {
    assert.strictEqual(res.readable, true, 'res.readable initially true');
    res.on('end', function() {
      assert.strictEqual(res.readable, false,
                         'res.readable set to false after end');
      testServer.close();
    });
    res.resume();
  });
});
