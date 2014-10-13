
var Hjson = require("..");
var fs = require("fs");
var path = require("path");
var rootDir = path.normalize(path.join(__dirname, "asset"));

Hjson.setEndOfLine("\n");

function showErr(cap, s1, s2)
{
  console.log(cap+" FAILED!");
  console.log("--- actual:");
  console.log(s1);
  console.log("--- expected:");
  console.log(s2);
  process.exit(1);
}

fs.readdirSync(rootDir).forEach(function(file)
{
  var name = file.split("_test.hjson");
  if (name.length !== 2) return;
  name = name[0];

  var text = fs.readFileSync(path.join(rootDir, file), "utf8");
  var result = JSON.parse(fs.readFileSync(path.join(rootDir, name+"_result.json"), "utf8"));

  try
  {
    var data = Hjson.parse(text);
    var data1 = JSON.stringify(data, null, 2), data2 = JSON.stringify(result.data, null, 2);
    var hjson1 = Hjson.stringify(data);
    var hjson2 = fs.readFileSync(path.join(rootDir, name+"_result.txt"), "utf8");

    if (data1 !== data2) showErr(name+" parse", data1, data2);
    else if (hjson1 !== hjson2) showErr(name+" stringify", hjson1, hjson2);
    else console.log(name+" SUCCESS");
  }
  catch (err)
  {
    if (result.err) console.log(name+" SUCCESS");
    else showErr(name+" exception", err.toString(), "");
  }
});
