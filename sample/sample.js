
var Hjson=require("hjson");
var fs=require("fs");
var text=fs.readFileSync("test.hjson", "utf8");

// parse either JSON or Hjson
var data=Hjson.parse(text);
console.log(data.hello);
console.log();

// convert to JSON
console.log("--- JSON output:");
console.log(JSON.stringify(data, null, 2));
console.log();

// convert to Hjson
console.log("\n--- Hjson output:");
console.log(Hjson.stringify(data));

// parse, keep whitespace and comments
data=Hjson.rt.parse(text);

// modify like you normally would
data.foo="text";

console.log("\n--- Hjson output with comments:");
console.log(Hjson.rt.stringify(data));
