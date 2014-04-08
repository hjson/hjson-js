
var Hjson = require("hjson");
var fs=require("fs");
var text = fs.readFileSync("readme.hjson", "utf8");

// parse either JSON or Hjson
var data = Hjson.parse(text);
console.log(data.hello);

// convert to JSON
console.log(JSON.stringify(data));

// convert to Hjson
console.log(Hjson.stringify(data));
