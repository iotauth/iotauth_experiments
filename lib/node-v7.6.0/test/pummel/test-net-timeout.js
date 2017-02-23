'use strict';
const common = require('../common');
const assert = require('assert');
const net = require('net');

let exchanges = 0;
let starttime = null;
let timeouttime = null;
const timeout = 1000;

const echo_server = net.createServer(function(socket) {
  socket.setTimeout(timeout);

  socket.on('timeout', function() {
    console.log('server timeout');
    timeouttime = new Date();
    console.dir(timeouttime);
    socket.destroy();
  });

  socket.on('error', function(e) {
    throw new Error('Server side socket should not get error. ' +
                      'We disconnect willingly.');
  });

  socket.on('data', function(d) {
    console.log(d);
    socket.write(d);
  });

  socket.on('end', function() {
    socket.end();
  });
});

echo_server.listen(common.PORT, function() {
  console.log('server listening at ' + common.PORT);

  const client = net.createConnection(common.PORT);
  client.setEncoding('UTF8');
  client.setTimeout(0); // disable the timeout for client
  client.on('connect', function() {
    console.log('client connected.');
    client.write('hello\r\n');
  });

  client.on('data', function(chunk) {
    assert.strictEqual('hello\r\n', chunk);
    if (exchanges++ < 5) {
      setTimeout(function() {
        console.log('client write "hello"');
        client.write('hello\r\n');
      }, 500);

      if (exchanges === 5) {
        console.log('wait for timeout - should come in ' + timeout + ' ms');
        starttime = new Date();
        console.dir(starttime);
      }
    }
  });

  client.on('timeout', function() {
    throw new Error("client timeout - this shouldn't happen");
  });

  client.on('end', function() {
    console.log('client end');
    client.end();
  });

  client.on('close', function() {
    console.log('client disconnect');
    echo_server.close();
  });
});

process.on('exit', function() {
  assert.ok(starttime != null);
  assert.ok(timeouttime != null);

  const diff = timeouttime - starttime;
  console.log('diff = ' + diff);

  assert.ok(timeout < diff);

  // Allow for 800 milliseconds more
  assert.ok(diff < timeout + 800);
});
