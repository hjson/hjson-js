# hjson-js

[![Build Status](https://img.shields.io/travis/laktak/hjson-js.svg?style=flat-square)](http://travis-ci.org/laktak/hjson-js)
[![NPM version](https://img.shields.io/npm/v/hjson.svg?style=flat-square)](http://www.npmjs.com/package/hjson)
[![License](https://img.shields.io/github/license/laktak/hjson-js.svg?style=flat-square)](https://github.com/laktak/hjson-js/blob/master/LICENSE)

[Hjson](http://hjson.org), the Human JSON. A configuration file format for humans. Relaxed syntax, fewer mistakes, more comments.

![Hjson Intro](http://hjson.org/hjson1.gif)

```
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
usage: hjson [OPTIONS] [INPUT]

  hjson can be used to convert JSON from/to Hjson.

  hjson will read the given JSON/Hjson input file or read from stdin.
  - default: will output as Hjson.
    - with -sl: will output the opening brace on the same line.
    - with -root: will output braces for the root object.
    - with -quote: will quote all strings.
  - with -j or -json: will output as formatted JSON.
  - with -c or -json=compact: will output as JSON.
```

Sample:
- run `hjson test.json > test.hjson` to convert to Hjson
- run `hjson -j test.hjson > test.json` to convert to JSON


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
  - *quotes*: string, controls how strings are displayed.
    - "min": no quotes whenever possible (default)
    - "always": always use quotes
  - *space*: specifies the indentation of nested structures. If it is a number, it will specify the number of spaces to indent at each level. If it is a string (such as '\t' or '&nbsp;'), it contains the characters used to indent at each level.
  - *eol*: specifies the EOL sequence (default is set by Hjson.setEndOfLine())

### Hjson.endOfLine(), .setEndOfLine(eol)

Gets or sets the stringify EOL sequence ('\n' or '\r\n'). When running with node.js this defaults to os.EOL.

### Hjson.rt { parse, stringify }

This is a shortcut to roundtrip your comments when reading and updating a config file. It is the same as specifying the keepWsc option for the parse and stringify functions.

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
