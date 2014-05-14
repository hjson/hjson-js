/*
  hjson.js

  Public Domain.

  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

  This file creates a hjson_parse and a hjson_stringify function.


    hjson_parse(text)

      This method parses Hjson text to produce an object or array.
      It can throw a SyntaxError exception.

      The code is based on the the JSON version by Douglas Crockford:
      https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js


    hjson_stringify(value, replacer, space)

        value       any JavaScript value, usually an object or array.

        replacer    an optional parameter that determines how object
                    values are stringified for objects. It can be a
                    function or an array of strings.

        space       an optional parameter that specifies the indentation
                    of nested structures. If it is omitted, the text will
                    be packed without extra whitespace. If it is a number,
                    it will specify the number of spaces to indent at each
                    level. If it is a string (such as '\t' or '&nbsp;'),
                    it contains the characters used to indent at each level.

        This method produces a Hjson text from a JavaScript value.

        You can provide an optional replacer method. It will be passed the
        key and value of each member, with this bound to the containing
        object. The value that is returned from your method will be
        serialized. If your method returns undefined, then the member will
        be excluded from the serialization.

        If the replacer parameter is an array of strings, then it will be
        used to select the members to be serialized. It filters the results
        such that only members with keys listed in the replacer array are
        stringified.

        Values that do not have JSON representations, such as undefined or
        functions, will not be serialized. Such values in objects will be
        dropped; in arrays they will be replaced with null. You can use
        a replacer function to replace those with JSON values.
        JSON.stringify(undefined) returns undefined.

        The optional space parameter produces a stringification of the
        value that is filled with line breaks and indentation to make it
        easier to read.

        If the space parameter is a non-empty string, then that string will
        be used for indentation. If the space parameter is a number, then
        the indentation will be that many spaces.

        Example:

        text = JSON.stringify(['e', {pluribus: 'unum'}]);
        // text is '["e",{"pluribus":"unum"}]'


        text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
        // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

      The code is based on the the JSON version by Douglas Crockford:
      https://github.com/douglascrockford/JSON-js/blob/master/json2.js


  This is a reference implementation. You are free to copy, modify, or
  redistribute.

  This code should be minified before deployment.
*/

var EOL='\n';

var hjson_parse = (function ()
{
  "use strict";

  // This is a function that can parse a Hjson text, producing a JavaScript
  // data structure. It is a simple, recursive descent parser. It does not use
  // eval or regular expressions, so it can be used as a model for implementing
  // a JSON parser in other languages.

  // We are defining the function inside of another function to avoid creating
  // global variables.

  var text;
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

  // Call error when something is wrong.
  var error = function (m)
  {
    var i, col=0, line=1;
    for (i = at-1; i > 0 && text[i] !== '\n'; i--, col++) {}
    for (; i > 0; i--) if (text[i] === '\n') line++;
    throw new Error(m + " at line " + line + "," + col + " >>>" + text.substr(at-col, 20) + " ...");
  };

  var next = function (c)
  {
    // If a c parameter is provided, verify that it matches the current character.

    if (c && c !== ch)
      error("Expected '" + c + "' instead of '" + ch + "'");

    // Get the next character. When there are no more characters,
    // return the empty string.

    ch = text.charAt(at);
    at++;
    return ch;
  };

  var peek = function (offs)
  {
    // range check is not required
    return text.charAt(at + offs);
  }

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
            for (i = 0; i < 4; i++)
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

  var mlString = function ()
  {
    // Parse a multiline string value.
    var string = '', triple = 0;

    // we are at ''' +1 - get indent
    var indent = 0;
    while (true)
    {
      var c=peek(-indent-5);
      if (!c || c=='\n') break;
      indent++;
    }

    var skipIndent = function ()
    {
      var skip = indent;
      while (ch && ch <= ' ' && ch !== '\n' && skip-- > 0) next();
    }

    // skip white/to (newline)
    while (ch && ch <= ' ' && ch !== '\n') next();
    if (ch === '\n') { next(); skipIndent(); }

    // When parsing for string values, we must look for " and \ characters.
    while (true)
    {
      if (!ch) error("Bad multiline string");
      else if (ch === '\'')
      {
        triple++;
        next();
        if (triple === 3) return string;
        else continue;
      }
      else while (triple > 0)
      {
        string += '\'';
        triple--;
      }
      if (ch === '\n')
      {
        string += ch;
        next();
        skipIndent();
      }
      else
      {
        string += ch;
        next();
      }
    }
  };

  var keyname = function ()
  {
    // quotes for keys that consist only of letters and digits are optional in Hjson

    if (ch === '"') return string();

    var name = ch;
    while (next())
    {
      if (ch === ':') return name;
      else if (ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9')
        name += ch;
      else error("Bad name");
    }
    error("Bad name");
  };

  var white = function ()
  {
    while (ch)
    {
      // Skip whitespace.
      while (ch && ch <= ' ') next();
      // Hjson allows comments
      if (ch === "#")
      {
        while (ch && ch !== '\n') next();
      }
      else break;
    }
  };

  var wordOrString = function ()
  {
    // Hjson strings can be quoteless
    // returns string, true, false, or null.
    var value = ch;
    while (next())
    {
      if (value.length === 3 && value === "'''") return mlString();
      else if (value.length === 4)
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
        // in Hjson the comma is optional and trailing commas are allowed
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
        // duplicate keys overwrite the previous value
        object[key] = value();
        white();
        // in Hjson the comma is optional and trailing commas are allowed
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
    // Parse a Hjson value. It could be an object, an array, a string, a number or a word.

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


var hjson_stringify = (function ()
{
  "use strict";

  var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var escapableExceptBS = /[\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var escapableExceptBSLF = /[\"\x00-\x09\x0b\x0c\x0e-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var meta =
  {  // table of character substitutions
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"' : '\\"',
    '\\': '\\\\'
  };
  var escapableName = /[^a-zA-Z0-9]/;
  var gap = '';
  var indent = '  ';
  var rep;

  function isWhite(c) { return c <= ' '; }
  function isDigit(c) { return c >= '0' && c <= '9'; }
  function isKeyword(value) { return value == 'true' || value == 'false' || value == 'null'; }

  function quoteReplace(string)
  {
    return string.replace(escapable, function (a)
    {
      var c = meta[a];
      return typeof c === 'string'
        ? c
        : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    });
  }

  function quote(string, gap)
  {
    if (!string) return '""';

    escapableExceptBS.lastIndex = 0;
    var isEscapable = escapableExceptBS.test(string);

    // Check if we can insert this string without quotes

    var first = string[0], last = string[string.length-1];
    if (isEscapable ||
      isWhite(first) ||
      isDigit(first) ||
      first === '#' ||
      first === '-' ||
      first === '{' ||
      first === '[' ||
      isWhite(last) ||
      isKeyword(string))
    {
      // If the string contains no control characters, no quote characters, and no
      // backslash characters, then we can safely slap some quotes around it.
      // Otherwise we must also replace the offending characters with safe escape
      // sequences.

      escapable.lastIndex = 0;
      escapableExceptBSLF.lastIndex = 0;
      if (!escapableExceptBSLF.test(string)) return mlString(string, gap);
      else return '"' + (escapable.test(string) ? quoteReplace(string) : string) + '"';
    }
    else
    {
      // return without quotes
      return string;
    }
  }

  function mlString(string, gap)
  {
    var i, a = string.replace(/\r/g, "").split('\n');
    gap += indent;

    var res = EOL + gap + "'''";
    for (i = 0; i < a.length; i++)
    {
      res += EOL + gap + a[i];
    }
    return res + "'''";
  }

  function quoteName(name)
  {
    if (!name) return '""';

    // Check if we can insert this name without quotes

    if (escapableName.test(name))
    {
      escapable.lastIndex = 0;
      var isEscapable = escapable.test(name);
      return '"' + (isEscapable ? quoteReplace(name) : name) + '"';
    }
    else
    {
      // return without quotes
      return name;
    }
  }

  function str(key, holder)
  {
    // Produce a string from holder[key].

    var i,    // The loop counter.
      k,      // The member key.
      v,      // The member value.
      length,
      mind = gap,
      partial,
      value = holder[key];

    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.

    if (typeof rep === 'function')
    {
      value = rep.call(holder, key, value);
    }

    // What happens next depends on the value's type.

    switch (typeof value)
    {
      case 'string':
        return quote(value, gap);

      case 'number':
        // JSON numbers must be finite. Encode non-finite numbers as null.
        return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':
        // If the value is a boolean or null, convert it to a string. Note:
        // typeof null does not produce 'null'. The case is included here in
        // the remote chance that this gets fixed someday.
        return String(value);

      case 'object':
        // If the type is 'object', we might be dealing with an object or an array or
        // null.

        // Due to a specification blunder in ECMAScript, typeof null is 'object',
        // so watch out for that case.

        if (!value) return 'null';

        // Make an array to hold the partial results of stringifying this object value.
        gap += indent;
        partial = [];

        // Is the value an array?

        if (Object.prototype.toString.apply(value) === '[object Array]')
        {
          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.

          length = value.length;
          for (i = 0; i < length; i++)
          {
            partial[i] = str(i, value) || 'null';
          }

          // Join all of the elements together, separated with newline, and wrap them in
          // brackets.

          v = partial.length === 0
            ? '[]'
            : '[' + EOL + gap + partial.join(EOL + gap) + EOL + mind + ']';
          gap = mind;
          return v;
        }

        // If the replacer is an array, use it to select the members to be stringified.

        if (rep && typeof rep === 'object')
        {
          length = rep.length;
          for (i = 0; i < length; i++)
          {
            if (typeof rep[i] === 'string')
            {
              k = rep[i];
              v = str(k, value);
              if (v)
              {
                partial.push(quoteName(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        }
        else
        {
          // Otherwise, iterate through all of the keys in the object.
          for (k in value)
          {
            if (Object.prototype.hasOwnProperty.call(value, k))
            {
              v = str(k, value);
              if (v)
              {
                partial.push(quoteName(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        }

        // Join all of the member texts together, separated with newlines,
        // and wrap them in braces.

        v = partial.length === 0
          ? '{}'
          : '{' + EOL + gap + partial.join(EOL + gap) + EOL + mind + '}';
        gap = mind;
        return v;
    }
  }

  // Return the hjson_stringify function. It will have access to all of the above
  // functions and variables.

  return function (value, replacer, space)
  {
    // The stringify method takes a value and an optional replacer, and an optional
    // space parameter, and returns a Hjson text. The replacer can be a function
    // that can replace values, or an array of strings that will select the keys.
    // A default replacer method can be provided. Use of the space parameter can
    // produce text that is more easily readable.

    var i;

    // If the space parameter is a number, make an indent string containing that
    // many spaces. If it is a string, it will be used as the indent string.

    if (typeof space === 'number')
    {
      indent = '';
      for (i = 0; i < space; i++) indent += ' ';
    }
    else if (typeof space === 'string')
      indent = space;

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.

    rep = replacer;
    if (replacer && typeof replacer !== 'function' &&
        (typeof replacer !== 'object' ||
        typeof replacer.length !== 'number'))
    {
      throw new Error('hjson_stringify');
    }

    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.

    return str('', { '': value });
  };
}());


// node.js
if (typeof module!=='undefined' && module.exports)
{
  var os=require('os');
  EOL=os.EOL;
  module.exports=
  {
    parse: hjson_parse,
    stringify: hjson_stringify,
    endOfLine: function() { return EOL; },
    setEndOfLine: function(eol) { EOL=eol; }
  };
}
