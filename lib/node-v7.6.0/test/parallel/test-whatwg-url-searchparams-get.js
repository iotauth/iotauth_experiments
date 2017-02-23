'use strict';

require('../common');
const assert = require('assert');
const URLSearchParams = require('url').URLSearchParams;

let params;

// Get basics
params = new URLSearchParams('a=b&c=d');
assert.strictEqual(params.get('a'), 'b');
assert.strictEqual(params.get('c'), 'd');
assert.strictEqual(params.get('e'), null);
params = new URLSearchParams('a=b&c=d&a=e');
assert.strictEqual(params.get('a'), 'b');
params = new URLSearchParams('=b&c=d');
assert.strictEqual(params.get(''), 'b');
params = new URLSearchParams('a=&c=d&a=e');
assert.strictEqual(params.get('a'), '');

// More get() basics
params = new URLSearchParams('first=second&third&&');
assert.notStrictEqual(params, null, 'constructor returned non-null value.');
assert.strictEqual(true, params.has('first'),
                   'Search params object has name "first"');
assert.strictEqual(params.get('first'), 'second',
                   'Search params object has name "first" with value "second"');
assert.strictEqual(params.get('third'), '',
                   'Search params object has name "third" with empty value.');
assert.strictEqual(params.get('fourth'), null,
                   'Search params object has no "fourth" name and value.');

assert.throws(() => {
  params.get.call(undefined);
}, /^TypeError: Value of `this` is not a URLSearchParams$/);
assert.throws(() => {
  params.get();
}, /^TypeError: "name" argument must be specified$/);
