'use strict';
const common = require('../common');
const assert = require('assert');
const net = require('net');

function pingPongTest(port, host, on_complete) {
  const N = 100;
  const DELAY = 1;
  let count = 0;
  let client_ended = false;

  const server = net.createServer({ allowHalfOpen: true }, function(socket) {
    socket.setEncoding('utf8');

    socket.on('data', function(data) {
      console.log(data);
      assert.strictEqual('PING', data);
      assert.strictEqual('open', socket.readyState);
      assert.strictEqual(true, count <= N);
      setTimeout(function() {
        assert.strictEqual('open', socket.readyState);
        socket.write('PONG');
      }, DELAY);
    });

    socket.on('timeout', function() {
      console.error('server-side timeout!!');
      assert.strictEqual(false, true);
    });

    socket.on('end', function() {
      console.log('server-side socket EOF');
      assert.strictEqual('writeOnly', socket.readyState);
      socket.end();
    });

    socket.on('close', function(had_error) {
      console.log('server-side socket.end');
      assert.strictEqual(false, had_error);
      assert.strictEqual('closed', socket.readyState);
      socket.server.close();
    });
  });

  server.listen(port, host, common.mustCall(function() {
    const client = net.createConnection(port, host);

    client.setEncoding('utf8');

    client.on('connect', function() {
      assert.strictEqual('open', client.readyState);
      client.write('PING');
    });

    client.on('data', function(data) {
      console.log(data);
      assert.strictEqual('PONG', data);
      assert.strictEqual('open', client.readyState);

      setTimeout(function() {
        assert.strictEqual('open', client.readyState);
        if (count++ < N) {
          client.write('PING');
        } else {
          console.log('closing client');
          client.end();
          client_ended = true;
        }
      }, DELAY);
    });

    client.on('timeout', function() {
      console.error('client-side timeout!!');
      assert.strictEqual(false, true);
    });

    client.on('close', common.mustCall(function() {
      console.log('client.end');
      assert.strictEqual(N + 1, count);
      assert.ok(client_ended);
      if (on_complete) on_complete();
    }));
  }));
}

pingPongTest(common.PORT);
