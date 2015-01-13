# hjson-js

[![Build Status](https://img.shields.io/travis/laktak/hjson-js.svg?style=flat-square)](http://travis-ci.org/laktak/hjson-js)
[![NPM version](https://img.shields.io/npm/v/hjson.svg?style=flat-square)](http://www.npmjs.com/package/hjson)

Hjson, the Human JSON. A configuration file format that caters to humans and helps reduce the errors they make.

It supports `#`, `//` and `/**/` style comments as well as avoiding trailing/missing comma and other mistakes. For details and syntax see http://laktak.github.io/hjson.

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
  - without options: will output as Hjson.
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
  - *space*: an optional parameter that specifies the indentation of nested structures. If it is a number, it will specify the number of spaces to indent at each level. If it is a string (such as '\t' or '&nbsp;'), it contains the characters used to indent at each level.

### Hjson.endOfLine(), .setEndOfLine(eol)

Gets or sets the EOL character ('\n' or '\r\n').

### Hjson.bracesSameLine(), .setBracesSameLine(b)

Gets or sets if braces should appear on the same line (for stringify).

## modify & keep comments

You can modify a Hjson file and keep the whitespace & comments intact. This is useful if an app updates its config file.

```
// parse, keep whitespace and comments
// (they are stored in a non enumerable __WSC__ member)
var data = Hjson.parse(text, { keepWsc: true });

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
console.log(Hjson.stringify(data, { keepWsc: true }));
```

# Changes

- v1.5.0
  - Added support for the simplified syntax for keys. Previously only alphanumeric keys were allowed without quotes.
  - Fixed multiline strings: OS/file independent (EOL is always `\n`). Also the last LF is removed.

- v1.4.0
  - Changed the browser interface to match the node api (which didn't change).
  - Fixed parse for leading zeros ("00") and trailing comments.
  - Fixed stringify for /**/ and //
  - Added more test cases.

- v1.3.0
  - Added support for the simplified syntax.

- v1.2.0
  - Added old fashioned /**/ comments.
  - Fixed the missing EOL (cli only).

- v1.1.0
  - add // support

- v1.0.2
  - stringify bug fixes

- v1.0.0
  - Switched to v1 for semver.
  - Adds editing support via the `{ keepWsc: true }` option.
  - Removes stringify(value, replacer, space) replacer support
  - You can still use this syntax but replacer will no longer be called. This was removed in favor of editing support and because replacer provided an incomplete solution.
