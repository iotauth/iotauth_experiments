'use strict';
const common = require('../common');
const assert = require('assert');
const http = require('http');

// Simple test of Node's HTTP Client mutable headers
// OutgoingMessage.prototype.setHeader(name, value)
// OutgoingMessage.prototype.getHeader(name)
// OutgoingMessage.prototype.removeHeader(name, value)
// ServerResponse.prototype.statusCode
// <ClientRequest>.method
// <ClientRequest>.path

let test = 'headers';
const content = 'hello world\n';
const cookies = [
  'session_token=; path=/; expires=Sun, 15-Sep-2030 13:48:52 GMT',
  'prefers_open_id=; path=/; expires=Thu, 01-Jan-1970 00:00:00 GMT'
];

const s = http.createServer(common.mustCall((req, res) => {
  switch (test) {
    case 'headers':
      assert.throws(() => {
        res.setHeader();
      }, /^TypeError: Header name must be a valid HTTP Token \["undefined"\]$/);
      assert.throws(() => {
        res.setHeader('someHeader');
      }, /^Error: "value" required in setHeader\("someHeader", value\)$/);
      assert.throws(() => {
        res.getHeader();
      }, /^Error: "name" argument is required for getHeader\(name\)$/);
      assert.throws(() => {
        res.removeHeader();
      }, /^Error: "name" argument is required for removeHeader\(name\)$/);

      res.setHeader('x-test-header', 'testing');
      res.setHeader('X-TEST-HEADER2', 'testing');
      res.setHeader('set-cookie', cookies);
      res.setHeader('x-test-array-header', [1, 2, 3]);

      assert.strictEqual(res.getHeader('x-test-header'), 'testing');
      assert.strictEqual(res.getHeader('x-test-header2'), 'testing');

      res.removeHeader('x-test-header2');
      break;

    case 'contentLength':
      res.setHeader('content-length', content.length);
      assert.strictEqual(res.getHeader('Content-Length'), content.length);
      break;

    case 'transferEncoding':
      res.setHeader('transfer-encoding', 'chunked');
      assert.strictEqual(res.getHeader('Transfer-Encoding'), 'chunked');
      break;

    case 'writeHead':
      res.statusCode = 404;
      res.setHeader('x-foo', 'keyboard cat');
      res.writeHead(200, { 'x-foo': 'bar', 'x-bar': 'baz' });
      break;

    default:
      common.fail('Unknown test');
  }

  res.statusCode = 201;
  res.end(content);
}, 4));

s.listen(0, nextTest);


function nextTest() {
  if (test === 'end') {
    return s.close();
  }

  let bufferedResponse = '';

  http.get({ port: s.address().port }, common.mustCall((response) => {
    switch (test) {
      case 'headers':
        assert.strictEqual(response.statusCode, 201);
        assert.strictEqual(response.headers['x-test-header'], 'testing');
        assert.strictEqual(response.headers['x-test-array-header'],
                           [1, 2, 3].join(', '));
        assert.deepStrictEqual(cookies, response.headers['set-cookie']);
        assert.strictEqual(response.headers['x-test-header2'], undefined);
        test = 'contentLength';
        break;

      case 'contentLength':
        assert.strictEqual(+response.headers['content-length'], content.length);
        test = 'transferEncoding';
        break;

      case 'transferEncoding':
        assert.strictEqual(response.headers['transfer-encoding'], 'chunked');
        test = 'writeHead';
        break;

      case 'writeHead':
        assert.strictEqual(response.headers['x-foo'], 'bar');
        assert.strictEqual(response.headers['x-bar'], 'baz');
        assert.strictEqual(response.statusCode, 200);
        test = 'end';
        break;

      default:
        common.fail('Unknown test');
    }

    response.setEncoding('utf8');
    response.on('data', (s) => {
      bufferedResponse += s;
    });

    response.on('end', common.mustCall(() => {
      assert.strictEqual(bufferedResponse, content);
      common.mustCall(nextTest)();
    }));
  }));
}
