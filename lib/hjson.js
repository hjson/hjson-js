/*! @preserve
 * Hjson v2.0.8
 * http://hjson.org
 *
 * Copyright 2014-2016 Christian Zangl, MIT license
 * Details and documentation:
 * https://github.com/hjson/hjson-js
 *
 * This code is based on the the JSON version by Douglas Crockford:
 * https://github.com/douglascrockford/JSON-js (json_parse.js, json2.js)
 */

/*

  This file creates a Hjson object:


    Hjson.parse(text, options)

      options {
        keepWsc     boolean, keep white space and comments. This is useful
                    if you want to edit an hjson file and save it while
                    preserving comments (default false)
      }

      This method parses Hjson text to produce an object or array.
      It can throw a SyntaxError exception.


    Hjson.stringify(value, options)

      value         any JavaScript value, usually an object or array.

      options {     all options are

        keepWsc     boolean, keep white space. See parse.

        bracesSameLine
                    boolean, makes braces appear on the same line as the key
                    name. Default false.

        emitRootBraces
                    boolean, show braces for the root object. Default true.

        quotes      string, controls how strings are displayed.
                    "min"     - no quotes whenever possible (default)
                    "always"  - always use quotes

        space       specifies the indentation of nested structures. If it is
                    a number, it will specify the number of spaces to indent
                    at each level. If it is a string (such as '\t' or '  '),
                    it contains the characters used to indent at each level.

        eol         specifies the EOL sequence (default is set by
                    Hjson.setEndOfLine())

        colors      boolean, output ascii color codes
      }

      This method produces Hjson text from a JavaScript value.

      Values that do not have JSON representations, such as undefined or
      functions, will not be serialized. Such values in objects will be
      dropped; in arrays they will be replaced with null.
      stringify(undefined) returns undefined.


    Hjson.endOfLine()
    Hjson.setEndOfLine(eol)

      Gets or sets the stringify EOL sequence ('\n' or '\r\n').
      When running with node.js this defaults to os.EOL.


    Hjson.rt { parse, stringify }

      This is a shortcut to roundtrip your comments when reading and updating
      a config file. It is the same as specifying the keepWsc option for the
      parse and stringify functions.


    Hjson.version

      The version of this file.


  This is a reference implementation. You are free to copy, modify, or
  redistribute.

*/

/*jslint node: true */
"use strict";

var hjsonOpt = require("./hjson-opt");
var hjsonVersion = require("./hjson-version");
var hjsonParse = require("./hjson-parse");
var hjsonStringify = require("./hjson-stringify");

module.exports={

  parse: hjsonParse,
  stringify: hjsonStringify,

  endOfLine: function() { return hjsonOpt.EOL; },
  setEndOfLine: function(eol) {
    if (eol === '\n' || eol === '\r\n') hjsonOpt.EOL = eol;
  },

  version: hjsonVersion,

  // round trip shortcut
  rt: {
    parse: function(text, options) {
      (options=options||{}).keepWsc=true;
      return hjsonParse(text, options);
    },
    stringify: function(value, options) {
      (options=options||{}).keepWsc=true;
      return hjsonStringify(value, options);
    },
  },

};
