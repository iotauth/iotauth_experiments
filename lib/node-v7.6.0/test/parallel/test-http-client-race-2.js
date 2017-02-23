'use strict';
require('../common');
const assert = require('assert');
const http = require('http');
const url = require('url');

//
// Slight variation on test-http-client-race to test for another race
// condition involving the parsers FreeList used internally by http.Client.
//

const body1_s = '1111111111111111';
const body2_s = '22222';
const body3_s = '3333333333333333333';

const server = http.createServer(function(req, res) {
  const pathname = url.parse(req.url).pathname;

  let body;
  switch (pathname) {
    case '/1': body = body1_s; break;
    case '/2': body = body2_s; break;
    default: body = body3_s;
  }

  res.writeHead(200,
                {'Content-Type': 'text/plain', 'Content-Length': body.length});
  res.end(body);
});
server.listen(0);

let body1 = '';
let body2 = '';
let body3 = '';

server.on('listening', function() {
  //
  // Client #1 is assigned Parser #1
  //
  const req1 = http.get({ port: this.address().port, path: '/1' });
  req1.on('response', function(res1) {
    res1.setEncoding('utf8');

    res1.on('data', function(chunk) {
      body1 += chunk;
    });

    res1.on('end', function() {
      //
      // Delay execution a little to allow the 'close' event to be processed
      // (required to trigger this bug!)
      //
      setTimeout(function() {
        //
        // The bug would introduce itself here: Client #2 would be allocated the
        // parser that previously belonged to Client #1. But we're not finished
        // with Client #1 yet!
        //
        // At this point, the bug would manifest itself and crash because the
        // internal state of the parser was no longer valid for use by Client #1
        //
        const req2 = http.get({ port: server.address().port, path: '/2' });
        req2.on('response', function(res2) {
          res2.setEncoding('utf8');
          res2.on('data', function(chunk) { body2 += chunk; });
          res2.on('end', function() {

            //
            // Just to be really sure we've covered all our bases, execute a
            // request using client2.
            //
            const req3 = http.get({ port: server.address().port, path: '/3' });
            req3.on('response', function(res3) {
              res3.setEncoding('utf8');
              res3.on('data', function(chunk) { body3 += chunk; });
              res3.on('end', function() { server.close(); });
            });
          });
        });
      }, 500);
    });
  });
});

process.on('exit', function() {
  assert.strictEqual(body1_s, body1);
  assert.strictEqual(body2_s, body2);
  assert.strictEqual(body3_s, body3);
});
