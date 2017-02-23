'use strict';
require('../common');
const assert = require('assert');
const zlib = require('zlib');

const gzip = zlib.createGzip();
const gunz = zlib.createUnzip();

gzip.pipe(gunz);

let output = '';
const input = 'A line of data\n';
gunz.setEncoding('utf8');
gunz.on('data', function(c) {
  output += c;
});

process.on('exit', function() {
  assert.strictEqual(output, input);

  // Make sure that the flush flag was set back to normal
  assert.strictEqual(gzip._flushFlag, zlib.constants.Z_NO_FLUSH);

  console.log('ok');
});

// make sure that flush/write doesn't trigger an assert failure
gzip.flush(); write();
function write() {
  gzip.write(input);
  gzip.end();
  gunz.read(0);
}
