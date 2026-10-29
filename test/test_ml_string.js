var assert = require("assert");
var Hjson = require("..");

var values = [
  "'starts with a quote\\n",
  " starts with a space\\n'",
  "'starts and ends with quotes\\n'",
  "plain\\nvalue"
];

values.forEach(function(value) {
  var output = Hjson.stringify({ test: value });
  var parsed;

  assert.doesNotThrow(function() {
    parsed = Hjson.parse(output);
  }, "stringified value should be parseable: " + value);
  assert.strictEqual(parsed.test, value);
});

var compact = Hjson.stringify({ test: " hello\\nvalue" });
assert(compact.indexOf("test: ''' hello\\nvalue'''") !== -1,
  "ordinary one-line escaped strings should keep the compact form");

console.log("multiline string boundary tests passed");
