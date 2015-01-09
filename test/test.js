
var Hjson = require("..");
var fs = require("fs");
var path = require("path");
var rootDir = path.normalize(path.join(__dirname, "assets"));

var argv=process.argv.slice(2)
var filter=argv[0];

Hjson.setEndOfLine("\n");

function failErr(name, type, s1, s2) {
  console.log(name+" "+type+" FAILED!");
  if (s1 || s2) {
    console.log("--- actual:");
    console.log(s1);
    console.log("--- expected:");
    console.log(s2);
  }
  process.exit(1);
}

console.log("running tests...");

fs.readdirSync(rootDir).forEach(function(file) {
  var name = file.split("_test.");
  if (name.length < 2) return;
  var isJson = name[2] === "json";
  name = name[0];

  if (filter && name.indexOf(filter) < 0) return; // ignore

  var text = fs.readFileSync(path.join(rootDir, file), "utf8");
  var shouldFail = name.substr(0, 4) === "fail";

  try {
    var data = Hjson.parse(text);
    var data1 = JSON.stringify(data, null, 2);
    var hjson1 = Hjson.stringify(data);

    if (!shouldFail) {
      var result = JSON.parse(fs.readFileSync(path.join(rootDir, name+"_result.json"), "utf8"));
      var data2 = JSON.stringify(result, null, 2);
      var hjson2 = fs.readFileSync(path.join(rootDir, name+"_result.hjson"), "utf8");
      if (data1 !== data2) failErr(name, "parse", data1, data2);
      if (hjson1 !== hjson2) failErr(name, "stringify", hjson1, hjson2);
      if (isJson) {
        var json1 = JSON.stringify(data), json2 = JSON.stringify(JSON.parse(text));
        if (json1 !== json2) failErr(name, "json chk", json1, json2);
      }
    }
    else failErr(name, "should fail");
  }
  catch (err) {
    if (!shouldFail) failErr(name, "exception", err.toString(), "");
  }
  console.log("- "+name+" OK");
});

console.log("ALL OK!");
