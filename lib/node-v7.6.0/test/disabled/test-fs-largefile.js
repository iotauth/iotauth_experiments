'use strict';
const common = require('../common');
const assert = require('assert');
const path = require('path'),
    fs = require('fs'),
    filepath = path.join(common.tmpDir, 'large.txt'),
    fd = fs.openSync(filepath, 'w+'),
    offset = 5 * 1024 * 1024 * 1024, // 5GB
    message = 'Large File';

fs.truncateSync(fd, offset);
assert.strictEqual(fs.statSync(filepath).size, offset);
var writeBuf = Buffer.from(message);
fs.writeSync(fd, writeBuf, 0, writeBuf.length, offset);
var readBuf = Buffer.allocUnsafe(writeBuf.length);
fs.readSync(fd, readBuf, 0, readBuf.length, offset);
assert.strictEqual(readBuf.toString(), message);
fs.readSync(fd, readBuf, 0, 1, 0);
assert.strictEqual(readBuf[0], 0);

var exceptionRaised = false;
try {
  fs.writeSync(fd, writeBuf, 0, writeBuf.length, 42.000001);
} catch (err) {
  console.log(err);
  exceptionRaised = true;
  assert.strictEqual(err.message, 'Not an integer');
}
assert.ok(exceptionRaised);
fs.close(fd);

process.on('exit', function() {
  fs.unlinkSync(filepath);
});
