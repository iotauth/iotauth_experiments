const d = require('./d');

const assert = require('assert');

const package = require('./package');

assert.strictEqual('world', package.hello);

console.error('load fixtures/b/c.js');

var string = 'C';

exports.SomeClass = function() {

};

exports.C = function() {
  return string;
};

exports.D = function() {
  return d.D();
};

process.on('exit', function() {
  string = 'C done';
  console.log('b/c.js exit');
});
