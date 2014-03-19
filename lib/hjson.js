/*
  hjson.js

  Adopted for HJSON from the JSON version: https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js

  Public Domain.

  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

  This file creates a hjson_parse function.

    json_parse(text)
      This method parses HJSON text to produce an object or array.
      It can throw a SyntaxError exception.

  This is a reference implementation. You are free to copy, modify, or
  redistribute.

  This code should be minified before deployment.
*/

var hjson_parse = (function ()
{
  "use strict";

  // This is a function that can parse a HJSON text, producing a JavaScript
  // data structure. It is a simple, recursive descent parser. It does not use
  // eval or regular expressions, so it can be used as a model for implementing
  // a JSON parser in other languages.

  // We are defining the function inside of another function to avoid creating
  // global variables.

  var at;   // The index of the current character
  var ch;   // The current character
  var escapee =
  {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b:  '\b',
    f:  '\f',
    n:  '\n',
    r:  '\r',
    t:  '\t'
  };

  var text;

  var error = function (m)
  {
    // Call error when something is wrong.
    throw (
    {
      name:  'SyntaxError',
      message: m,
      at:   at,
      text:  text
    });
  };

  var next = function (c)
  {
    // If a c parameter is provided, verify that it matches the current character.

    if (c && c !== ch)
      error("Expected '" + c + "' instead of '" + ch + "'");

    // Get the next character. When there are no more characters,
    // return the empty string.

    ch = text.charAt(at);
    at += 1;
    return ch;
  };

  var number = function ()
  {
    // Parse a number value.

    var number, string = '';

    if (ch === '-')
    {
      string = '-';
      next('-');
    }
    while (ch >= '0' && ch <= '9')
    {
      string += ch;
      next();
    }
    if (ch === '.')
    {
      string += '.';
      while (next() && ch >= '0' && ch <= '9')
        string += ch;
    }
    if (ch === 'e' || ch === 'E')
    {
      string += ch;
      next();
      if (ch === '-' || ch === '+')
      {
        string += ch;
        next();
      }
      while (ch >= '0' && ch <= '9')
      {
        string += ch;
        next();
      }
    }
    number = +string;
    if (!isFinite(number)) error("Bad number");
    else return number;
  };

  var string = function ()
  {
    // Parse a string value.
    var hex, i, string = '', uffff;

    // When parsing for string values, we must look for " and \ characters.
    if (ch === '"')
    {
      while (next())
      {
        if (ch === '"')
        {
          next();
          return string;
        }
        if (ch === '\\')
        {
          next();
          if (ch === 'u')
          {
            uffff = 0;
            for (i = 0; i < 4; i += 1)
            {
              hex = parseInt(next(), 16);
              if (!isFinite(hex))
                break;
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          }
          else if (typeof escapee[ch] === 'string') string += escapee[ch];
          else break;
        }
        else string += ch;
      }
    }
    error("Bad string");
  };

  var keyname = function ()
  {
    // quotes for keys that consist only of letters and digits are optional in HJSON

    if (ch === '"') return string();

    var name = ch;
    while (next())
    {
      if (ch === ':') return name;
      else if (ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9')
        name += ch;
      else error("Bad name; "+ch);
    }
    error("Bad name");
  };

  var white = function ()
  {
    while (ch)
    {
      // Skip whitespace.
      while (ch && ch <= ' ') next();
      // HJSON allows comments
      if (ch === "#")
      {
        while (ch && ch !== '\n') next();
      }
      else break;
    }
  };

  var wordOrString = function ()
  {
    // HJSON strings can be quoteless
    // returns string, true, false, or null.
    var value = ch;
    while (next())
    {
      if (value.length === 4)
      {
        if (value === "true") return true;
        else if (value === "null") return null;
      }
      else if (value.length === 5 && value === "false") return false;
      else if (ch === '\r' || ch === '\n') return value;
      value += ch;
    }

    error("Bad value");
  };

  var array = function ()
  {
    // Parse an array value.

    var array = [];

    if (ch === '[')
    {
      next('[');
      white();
      if (ch === ']')
      {
        next(']');
        return array;  // empty array
      }
      while (ch)
      {
        array.push(value());
        white();
        // in HJSON the comma is optional and trailing commas are allowed
        if (ch === ',') { next(); white(); }
        if (ch === ']')
        {
          next(']');
          return array;
        }
        white();
      }
    }
    error("Bad array");
  };

  var object = function ()
  {
    // Parse an object value.

    var key,
      object = {};

    if (ch === '{')
    {
      next('{');
      white();
      if (ch === '}')
      {
        next('}');
        return object;  // empty object
      }
      while (ch)
      {
        key = keyname();
        white();
        next(':');
        if (Object.hasOwnProperty.call(object, key))
          error('Duplicate key "' + key + '"');
        object[key] = value();
        white();
        // in HJSON the comma is optional and trailing commas are allowed
        if (ch === ',') { next(); white(); }
        if (ch === '}')
        {
          next('}');
          return object;
        }
        white();
      }
    }
    error("Bad object");
  };

  var value = function ()
  {
    // Parse a HJSON value. It could be an object, an array, a string, a number or a word.

    white();
    switch (ch)
    {
      case '{': return object();
      case '[': return array();
      case '"': return string();
      case '-': return number();
      default: return ch >= '0' && ch <= '9' ? number() : wordOrString();
    }
  };

  // Return the hjson_parse function. It will have access to all of the above
  // functions and variables.

  return function (source)
  {
    var result;

    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) error("Syntax error");

    return result;
  };
}());

// node.js
module.exports=
{
  parse: hjson_parse
};
