
var Hjson = require("hjson");
var fs=require("fs");
var text = fs.readFileSync("readme.hjson", "utf8");

// parse either JSON or Hjson
var data = Hjson.parse(text);
console.log(data.hello);
console.log();

// convert to JSON
console.log("JSON output:");
console.log(JSON.stringify(data));
console.log();

// convert to Hjson
console.log("Hjson output:");
console.log(Hjson.stringify(data));

// parse, keep whitespace and comments
// (they are stored in a non enumerable __WSC__ member)
data = Hjson.parse(text, { keepWsc: true });

// modify like you normally would
data.foo = "text";

// you can also edit comments by accessing __WSC__
var wsc = data.__WSC__;
// __WSC__ for objects contains { c: {}, o: [] }
// - c with the actual comment and
// - o (array) with the order of the members
wsc.c.hugo = "just another test";
wsc.o.splice(2, 0, "hugo");
data.hugo = "value";

data.arrayWithComments = [ "a" ];
// __WSC__ for arrays is just an array with the
// comments ([0] for the space before the elements)
data.arrayWithComments.__WSC__ = [ "\n    # before a", "after a" ];

// convert back to Hjson
console.log(Hjson.stringify(data, { keepWsc: true }));
