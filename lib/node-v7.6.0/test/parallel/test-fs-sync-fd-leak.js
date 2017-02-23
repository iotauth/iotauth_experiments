'use strict';
require('../common');
const assert = require('assert');
const fs = require('fs');

// ensure that (read|write|append)FileSync() closes the file descriptor
fs.openSync = function() {
  return 42;
};
fs.closeSync = function(fd) {
  assert.strictEqual(fd, 42);
  close_called++;
};
fs.readSync = function() {
  throw new Error('BAM');
};
fs.writeSync = function() {
  throw new Error('BAM');
};

fs.fstatSync = function() {
  throw new Error('BAM');
};

let close_called = 0;
ensureThrows(function() {
  fs.readFileSync('dummy');
});
ensureThrows(function() {
  fs.writeFileSync('dummy', 'xxx');
});
ensureThrows(function() {
  fs.appendFileSync('dummy', 'xxx');
});

function ensureThrows(cb) {
  let got_exception = false;

  close_called = 0;
  try {
    cb();
  } catch (e) {
    assert.strictEqual(e.message, 'BAM');
    got_exception = true;
  }

  assert.strictEqual(close_called, 1);
  assert.strictEqual(got_exception, true);
}
