# hjson-js

[![Build Status](https://img.shields.io/travis/hjson/hjson-js.svg?style=flat-square)](http://travis-ci.org/hjson/hjson-js)
[![NPM version](https://img.shields.io/npm/v/hjson.svg?style=flat-square)](http://www.npmjs.com/package/hjson)
[![License](https://img.shields.io/github/license/hjson/hjson-js.svg?style=flat-square)](https://github.com/hjson/hjson-js/blob/master/LICENSE)

[Hjson](http://hjson.org), the Human JSON. A configuration file format for humans. Relaxed syntax, fewer mistakes, more comments.

![Hjson Intro](http://hjson.org/hjson1.gif)

```Hjson
{
  # specify rate in requests/second (because comments are helpful!)
  rate: 1000

  // prefer c-style comments?
  /* feeling old fashioned? */

  # did you notice that rate doesn't need quotes?
  hey: look ma, no quotes for strings either!

  # best of all
  notice: []
  anything: ?

  # yes, commas are optional!
}
```

The JavaScript implementation of Hjson is based on [JSON-js](https://github.com/douglascrockford/JSON-js). For other platforms see [hjson.org](http://hjson.org).

# Install from npm

```
npm install hjson
```

# Usage

```
var Hjson = require('hjson');

var obj = Hjson.parse(hjsonText);
var text2 = Hjson.stringify(obj);
```

To keep comments intact see [API](#modify--keep-comments).

## From the Commandline

Install with `npm install hjson -g`.

```
Usage:
  hjson [OPTIONS]
  hjson [OPTIONS] INPUT
  hjson (-h | --help | -?)
  hjson (-V | --version)

INPUT can be in JSON or Hjson format.
If no file is given it will read from stdin.
The default is to output as Hjson.

Options:
  (-j | -json)  output as formatted JSON.
  (-c | -json=compact)  output as JSON.
  -sl     output the opening brace on the same line (Hjson)
  -root   output braces for the root object (Hjson)
  -quote  quote all strings (Hjson)
  -rt     round trip comments (Hjson)
  -nocol  disable colors (Hjson)

```

Sample:
- run `hjson -j test.hjson > test.json` to convert to JSON
- run `hjson test.json > test.hjson` to convert to Hjson
- run `hjson test.json` to view colorized output


# API

The API is the same for the browser and node.js version.

### Hjson.parse(text, options)

This method parses *JSON* or *Hjson* text to produce an object or array.

- *text*: the string to parse as JSON or Hjson
- *options*: object
  - *keepWsc*: boolean, keep white space and comments. This is useful if you want to edit an hjson file and save it while preserving comments (default false)

### Hjson.stringify(value, options)

This method produces Hjson text from a JavaScript value.

- *value*: any JavaScript value, usually an object or array.
- *options*: object
  - *keepWsc*: boolean, keep white space. See parse.
  - *bracesSameLine*: boolean, makes braces appear on the same line as the key name. Default false.
  - *emitRootBraces*: boolean, show braces for the root object. Default true.
  - *quotes*: string, controls how strings are displayed.
    - "min": no quotes whenever possible (default)
    - "always": always use quotes
  - *space*: specifies the indentation of nested structures. If it is a number, it will specify the number of spaces to indent at each level. If it is a string (such as '\t' or '&nbsp;'), it contains the characters used to indent at each level.
  - *eol*: specifies the EOL sequence (default is set by Hjson.setEndOfLine())
  - *colors*: boolean, output ascii color codes

### Hjson.endOfLine(), .setEndOfLine(eol)

Gets or sets the stringify EOL sequence ('\n' or '\r\n'). When running with node.js this defaults to os.EOL.

### Hjson.rt { parse, stringify }

This is a shortcut to roundtrip your comments when reading and updating a config file. It is the same as specifying the keepWsc option for the parse and stringify functions.

### Hjson.version

The version number.

### require-hook

Require a config file directly.

```
require("hjson/lib/require-config");
var cfg=require("./config.hjson");
```

## modify & keep comments

You can modify a Hjson file and keep the whitespace & comments intact (round trip). This is useful if an app updates its config file.

```
// parse, keep whitespace and comments
// (they are stored in a non enumerable __WSC__ member)
var data = Hjson.rt.parse(text);

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
data.arrayWithComments.__WSC__ = [ "before a", "after a" ];

// convert back to Hjson
console.log(Hjson.rt.stringify(data));
```

# History

[see history.md](history.md)
