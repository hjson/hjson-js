
var Hjson = require("..");
var fs = require("fs");
var path = require("path");
var rootDir = path.normalize(path.join(__dirname, "assets"));

var argv=process.argv.slice(2)
var filter=argv[0];
var success=true;

function failErr(name, type, s1, s2, msg) {
  msg=msg||"  "+name+" "+type+" FAILED!";
  console.log(msg);
  if (s1 || s2) {
    var i=0;
    while (i<s1.length && s1[i]===s2[i]) i++;
    console.log("--- actual (diff at "+i+";"+s1[i].charCodeAt(0)+":"+s2[i].charCodeAt(0)+"):");
    console.log(s1);
    console.log("--- expected:");
    console.log(s2);
  }
  success=false;
}

function load(file, cr) {
  var text = fs.readFileSync(path.join(rootDir, file), "utf8");
  var std = text.replace(/\r/g, ""); // make sure we have unix style text regardless of the input
  return cr ? std.replace(/\n/g, "\r\n") : std;
}

function test(name, file, isJson, inputCr, outputCr) {
  var text = load(file, inputCr);
  var shouldFail = name.substr(0, 4) === "fail";
  var metaPath = path.join(rootDir, name+"_testmeta.hjson");
  var meta = fs.existsSync(metaPath) ? Hjson.parse(fs.readFileSync(metaPath, "utf8")) : {};
  Hjson.setEndOfLine(outputCr?"\r\n":"\n");

  try {
    var data = Hjson.parse(text);

    if (!shouldFail) {
      var jsonFromData = JSON.stringify(data, null, 2);
      var hjsonFromData = Hjson.stringify(data, meta.options);
      var jsonResultRaw = load(name+"_result.json", inputCr);
      var jsonResult = JSON.stringify(JSON.parse(jsonResultRaw), null, 2);
      var hjsonResult = load(name+"_result.hjson", outputCr);
      if (jsonFromData !== jsonResult) failErr(name, "parse", jsonFromData, jsonResult);
      if (hjsonFromData !== hjsonResult) failErr(name, "stringify", hjsonFromData, hjsonResult);
      if (!inputCr && !outputCr && jsonResultRaw !== jsonResult) failErr(name, "json-input", jsonResultRaw, jsonResult);
      if (isJson) {
        // if the input is JSON we can also compare Hjson.parse to JSON.parse
        var json1 = JSON.stringify(data), json2 = JSON.stringify(JSON.parse(text));
        if (json1 !== json2) failErr(name, "json chk", json1, json2);
      }
    }
    else failErr(name, null, null, null, "  should fail but succeeded");
  }
  catch (err) {
    if (!shouldFail) failErr(name, "exception", err.toString(), "");
  }
}

console.log("running tests...");

var tests=fs.readFileSync(path.join(rootDir, "testlist.txt"), "utf8").split("\n");
tests.forEach(function(file) {
  var name = file.split("_test.");
  if (name.length < 2) return;
  var isJson = name[2] === "json";
  name = name[0];

  if (filter && name.indexOf(filter) < 0) return; // ignore

  console.log("- "+name);
  test(name, file, isJson, false, false);
  test(name, file, isJson, false, true);
  test(name, file, isJson, true, false);
  test(name, file, isJson, true, true);
});

console.log(success?"ALL OK!":"FAIL!");
process.exit(success?0:1);

