"use strict";

var assert = require("assert");

module.exports = function(Hjson) {
  var values = [
    ' "quoted"', '\tindented', ' \\path', '\t"quoted"',
    'a\r\nb', 'x\ry', '\rstart', 'end\r', '\r',
    ' \t\\path ', '  first\n\tsecond', '\n first\n',
    'ordinary\\path', 'two\nlines', 'plain', '   '
  ];

  var modes = [{}, { multiline: 'no-tabs' }, { multiline: 'off' },
    { quotes: 'all' }, { keepWsc: true }];
  ['\n', '\r\n'].forEach(function(eol) {
    modes.forEach(function(mode) {
      values.forEach(function(value) {
        var options = Object.assign({ eol: eol }, mode);
        var object = { k: value, nested: [value, { k: value }] };
        var output = Hjson.stringify(object, options);
        assert.deepStrictEqual(Hjson.parse(output), object,
          'round trip ' + JSON.stringify(value) + ' with ' + JSON.stringify(options));
        assert.strictEqual(Hjson.parse(Hjson.stringify(value, options)), value);
      });
    });
  });

  // Ordinary multiline output should retain its readable block representation.
  assert.strictEqual(Hjson.stringify({ k: '  first\n\tsecond' }, { eol: '\n' }),
    "{\n  k:\n    '''\n      first\n    \tsecond\n    '''\n}");
  assert.strictEqual(Hjson.stringify({ k: '\tindented' }, { eol: '\n' }),
    '{\n  k: "\\tindented"\n}');
  assert.strictEqual(Hjson.stringify({ k: 'x\ry' }, { eol: '\n' }),
    '{\n  k: "x\\ry"\n}');
};

if (require.main === module) {
  module.exports(require('..'));
}
