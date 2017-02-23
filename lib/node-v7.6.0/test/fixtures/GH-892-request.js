// Called by test/pummel/test-regress-GH-892.js

const https = require('https');
const fs = require('fs');
const assert = require('assert');

var PORT = parseInt(process.argv[2]);
var bytesExpected = parseInt(process.argv[3]);

var gotResponse = false;

var options = {
  method: 'POST',
  port: PORT,
  rejectUnauthorized: false
};

var req = https.request(options, function(res) {
  assert.strictEqual(200, res.statusCode);
  gotResponse = true;
  console.error('DONE');
  res.resume();
});

req.end(Buffer.allocUnsafe(bytesExpected));

process.on('exit', function() {
  assert.ok(gotResponse);
});
