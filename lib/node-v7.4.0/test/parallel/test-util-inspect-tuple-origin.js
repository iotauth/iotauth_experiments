'use strict';

require('../common');
const assert = require('assert');
const inspect = require('util').inspect;
const originFor = require('url').originFor;

assert.strictEqual(
    inspect(originFor('http://test.com:8000')),
    `TupleOrigin {
      scheme: http,
      host: test.com,
      port: 8000,
      domain: null
    }`
  );

assert.strictEqual(
    inspect(originFor('http://test.com')),
    `TupleOrigin {
      scheme: http,
      host: test.com,
      port: undefined,
      domain: null
    }`
  );


assert.strictEqual(
    inspect(originFor('https://test.com')),
    `TupleOrigin {
      scheme: https,
      host: test.com,
      port: undefined,
      domain: null
    }`
  );
