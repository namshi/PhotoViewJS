var test = require('ava');
var PhotoView = require('../dist/build');

test('PhotoView exist', t => {
  t.is(typeof PhotoView, 'function', 'PhotoView doesnt exist');
});
