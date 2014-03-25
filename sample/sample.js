
var Hjson = require("hjson");
var fs=require("fs");
var text = fs.readFileSync("readme.hjson", "utf8");

var data = Hjson.parse(text);
console.log(data.hello);

// convert to json
console.log(JSON.stringify(data));
