'use strict';
// Flags: --expose_gc

const common = require('../common');
const assert = require('assert');

function newBuffer(size, value) {
  const buffer = Buffer.allocUnsafe(size);
  while (size--) {
    buffer[size] = value;
  }
  //buffer[buffer.length-2]= 0x0d;
  buffer[buffer.length - 1] = 0x0a;
  return buffer;
}

const fs = require('fs');
const testFileName = require('path').join(common.tmpDir, 'GH-814_testFile.txt');
const testFileFD = fs.openSync(testFileName, 'w');
console.log(testFileName);


const kBufSize = 128 * 1024;
let PASS = true;
const neverWrittenBuffer = newBuffer(kBufSize, 0x2e); //0x2e === '.'
const bufPool = [];


const tail = require('child_process').spawn('tail', ['-f', testFileName]);
tail.stdout.on('data', tailCB);

function tailCB(data) {
  PASS = data.toString().indexOf('.') < 0;
}


const timeToQuit = Date.now() + 8e3; //Test during no more than this seconds.
(function main() {

  if (PASS) {
    fs.write(testFileFD, newBuffer(kBufSize, 0x61), 0, kBufSize, -1, cb);
    global.gc();
    const nuBuf = Buffer.allocUnsafe(kBufSize);
    neverWrittenBuffer.copy(nuBuf);
    if (bufPool.push(nuBuf) > 100) {
      bufPool.length = 0;
    }
  } else {
    throw new Error("Buffer GC'ed test -> FAIL");
  }

  if (Date.now() < timeToQuit) {
    process.nextTick(main);
  } else {
    tail.kill();
    console.log("Buffer GC'ed test -> PASS (OK)");
  }

})();


function cb(err, written) {
  assert.ifError(err);
}
