'use strict';
const common = require('../common');
const assert = require('assert');
const http = require('http');
const net = require('net');

const tests = [];

function test(fn) {
  if (!tests.length)
    process.nextTick(run);
  tests.push(fn);
}

function run() {
  const fn = tests.shift();
  if (fn) {
    console.log('# %s', fn.name);
    fn(run);
  } else {
    console.log('ok');
  }
}

test(function serverTimeout(cb) {
  let caughtTimeout = false;
  process.on('exit', function() {
    assert(caughtTimeout);
  });
  const server = http.createServer(function(req, res) {
    // just do nothing, we should get a timeout event.
  });
  server.listen(common.mustCall(function() {
    http.get({ port: server.address().port }).on('error', function() {});
  }));
  const s = server.setTimeout(50, function(socket) {
    caughtTimeout = true;
    socket.destroy();
    server.close();
    cb();
  });
  assert.ok(s instanceof http.Server);
});

test(function serverRequestTimeout(cb) {
  let caughtTimeout = false;
  process.on('exit', function() {
    assert(caughtTimeout);
  });
  const server = http.createServer(function(req, res) {
    // just do nothing, we should get a timeout event.
    const s = req.setTimeout(50, function() {
      caughtTimeout = true;
      req.socket.destroy();
      server.close();
      cb();
    });
    assert.ok(s instanceof http.IncomingMessage);
  });
  server.listen(common.mustCall(function() {
    const port = server.address().port;
    const req = http.request({ port: port, method: 'POST' });
    req.on('error', function() {});
    req.write('Hello');
    // req is in progress
  }));
});

test(function serverResponseTimeout(cb) {
  let caughtTimeout = false;
  process.on('exit', function() {
    assert(caughtTimeout);
  });
  const server = http.createServer(function(req, res) {
    // just do nothing, we should get a timeout event.
    const s = res.setTimeout(50, function() {
      caughtTimeout = true;
      res.socket.destroy();
      server.close();
      cb();
    });
    assert.ok(s instanceof http.OutgoingMessage);
  });
  server.listen(common.mustCall(function() {
    const port = server.address().port;
    http.get({ port: port }).on('error', function() {});
  }));
});

test(function serverRequestNotTimeoutAfterEnd(cb) {
  let caughtTimeoutOnRequest = false;
  let caughtTimeoutOnResponse = false;
  process.on('exit', function() {
    assert(!caughtTimeoutOnRequest);
    assert(caughtTimeoutOnResponse);
  });
  const server = http.createServer(function(req, res) {
    // just do nothing, we should get a timeout event.
    const s = req.setTimeout(50, function(socket) {
      caughtTimeoutOnRequest = true;
    });
    assert.ok(s instanceof http.IncomingMessage);
    res.on('timeout', function(socket) {
      caughtTimeoutOnResponse = true;
    });
  });
  server.on('timeout', function(socket) {
    socket.destroy();
    server.close();
    cb();
  });
  server.listen(common.mustCall(function() {
    const port = server.address().port;
    http.get({ port: port }).on('error', function() {});
  }));
});

test(function serverResponseTimeoutWithPipeline(cb) {
  let caughtTimeout = '';
  process.on('exit', function() {
    assert.strictEqual(caughtTimeout, '/2');
  });
  const server = http.createServer(function(req, res) {
    const s = res.setTimeout(50, function() {
      caughtTimeout += req.url;
    });
    assert.ok(s instanceof http.OutgoingMessage);
    if (req.url === '/1') res.end();
  });
  server.on('timeout', function(socket) {
    socket.destroy();
    server.close();
    cb();
  });
  server.listen(common.mustCall(function() {
    const port = server.address().port;
    const c = net.connect({ port: port, allowHalfOpen: true }, function() {
      c.write('GET /1 HTTP/1.1\r\nHost: localhost\r\n\r\n');
      c.write('GET /2 HTTP/1.1\r\nHost: localhost\r\n\r\n');
      c.write('GET /3 HTTP/1.1\r\nHost: localhost\r\n\r\n');
    });
  }));
});

test(function idleTimeout(cb) {
  let caughtTimeoutOnRequest = false;
  let caughtTimeoutOnResponse = false;
  let caughtTimeoutOnServer = false;
  process.on('exit', function() {
    assert(!caughtTimeoutOnRequest);
    assert(!caughtTimeoutOnResponse);
    assert(caughtTimeoutOnServer);
  });
  const server = http.createServer(function(req, res) {
    req.on('timeout', function(socket) {
      caughtTimeoutOnRequest = true;
    });
    res.on('timeout', function(socket) {
      caughtTimeoutOnResponse = true;
    });
    res.end();
  });
  const s = server.setTimeout(50, function(socket) {
    caughtTimeoutOnServer = true;
    socket.destroy();
    server.close();
    cb();
  });
  assert.ok(s instanceof http.Server);
  server.listen(common.mustCall(function() {
    const port = server.address().port;
    const c = net.connect({ port: port, allowHalfOpen: true }, function() {
      c.write('GET /1 HTTP/1.1\r\nHost: localhost\r\n\r\n');
      // Keep-Alive
    });
  }));
});
