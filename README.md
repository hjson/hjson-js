# hjson-js

HJSON reference parser implementation.

HJSON is JSON - commas + comments.

It should be used for configuration files, for debug output or where it is likely that JSON data is read or will be edited by a human.

That means that you can write:
```
{
  # look, no quotes or commas!
  foo: Hello World!
  bar: Hello HJSON!
}
```

instead of:
```
{
  "foo": "Hello World!",
  "bar": "Hello HJSON!"
}
```

For details see http://laktak.github.io/hjson.


# Install from npm

```
npm install hjson
```

# Usage

```
var HJSON = require('hjson');

var obj = HJSON.parse(hjsonText);
var text2 = HJSON.stringify(obj);

```

## From the Commandline

Install with `npm install hjson -g`.

```
usage: hjson [-json] [INPUT]

  hjson can be used to convert JSON from/to HJSON.

  hjson will read the given JSON/HJSON input file or read from stdin.
  - without options: will output as HJSON.
  - with -json: will output as formatted JSON.
  - with -json=compact: will output as JSON.
```

Sample:
- run `hjson test.json > test.hjson` to convert to HJSON
- run `hjson -json test.hjson > test.json` to convert to JSON
