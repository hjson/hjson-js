# hjson-js

Hjson, the Human JSON. A data format that caters to humans and helps reduce the errors they make.

For details and syntax see http://laktak.github.io/hjson.

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

To keep comments intact see [Editing](#editing-hjson).

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

See hjson.js

# Editing Hjson

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

## v1.0.2

- stringify bug fixes

## v1.0.0

- Switched to v1 for semver

- Adds editing support via the `{ keepWsc: true }` option.

- Removes stringify(value, replacer, space) replacer support

  You can still use this syntax but replacer will no longer be called. This was removed in favor of editing support and because replacer provided an incomplete solution.
