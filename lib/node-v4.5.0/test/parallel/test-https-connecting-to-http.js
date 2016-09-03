'use strict';
// This tests the situation where you try to connect a https client
// to an http server. You should get an error and exit.
var common = require('../common');
var assert = require('assert');
var http = require('http');

if (!common.hasCrypto) {
  common.skip('missing crypto');
  return;
}
var https = require('https');

var reqCount = 0;
var resCount = 0;
var reqErrorCount = 0;
var body = 'hello world\n';


var server = http.createServer(function(req, res) {
  reqCount++;
  console.log('got request');
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end(body);
});


server.listen(0, function() {
  var req = https.get({ port: this.address().port }, function(res) {
    resCount++;
  });

  req.on('error', function(e) {
    console.log('Got expected error: ', e.message);
    server.close();
    reqErrorCount++;
  });
});


process.on('exit', function() {
  assert.equal(0, reqCount);
  assert.equal(0, resCount);
  assert.equal(1, reqErrorCount);
});
