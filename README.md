# hjson-js

HJSON reference parser implementation.

HJSON is JSON for humans.

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

var obj = HJSON.parse(text);
```

