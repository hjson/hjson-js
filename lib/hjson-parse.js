/* Hjson http://hjson.org */
/* jslint node: true */
"use strict";

module.exports = function($source, $opt) {

  var tryParseNumber = require("./hjson-num");
  var hjsonOpt = require("./hjson-opt");

  var text;
  var at;   // The index of the current character
  var ch;   // The current character
  var escapee = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b:  '\b',
    f:  '\f',
    n:  '\n',
    r:  '\r',
    t:  '\t'
  };

  var keepWsc; // keep whitespace
  var dsf; // domain specific formats

  function resetAt() {
    at = 0;
    ch = ' ';
  }

  function isPunctuatorChar(c) {
    return c === '{' || c === '}' || c === '[' || c === ']' || c === ',' || c === ':';
  }

  // Call error when something is wrong.
  function error(m) {
    var i, col=0, line=1;
    for (i = at-1; i > 0 && text[i] !== '\n'; i--, col++) {}
    for (; i > 0; i--) if (text[i] === '\n') line++;
    throw new Error(m + " at line " + line + "," + col + " >>>" + text.substr(at-col, 20) + " ...");
  }

  function next() {
    // get the next character.
    ch = text.charAt(at);
    at++;
    return ch;
  }

  function peek(offs) {
    // range check is not required
    return text.charAt(at + offs);
  }

  function string() {
    // Parse a string value.
    var string = '';

    // When parsing for string values, we must look for " and \ characters.
    if (ch === '"') {
      while (next()) {
        if (ch === '"') {
          next();
          return string;
        }
        if (ch === '\\') {
          next();
          if (ch === 'u') {
            var uffff = 0;
            for (var i = 0; i < 4; i++) {
              next();
              var c = ch.charCodeAt(0), hex;
              if (ch >= '0' && ch <= '9') hex = c - 48;
              else if (ch >= 'a' && ch <= 'f') hex = c - 97 + 0xa;
              else if (ch >= 'A' && ch <= 'F') hex = c - 65 + 0xa;
              else error("Bad \\u char " + ch);
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          } else if (typeof escapee[ch] === 'string') {
            string += escapee[ch];
          } else break;
        } else {
          string += ch;
        }
      }
    }
    error("Bad string");
  }

  function mlString() {
    // Parse a multiline string value.
    var string = '', triple = 0;

    // we are at ''' +1 - get indent
    var indent = 0;
    while (true) {
      var c=peek(-indent-5);
      if (!c || c === '\n') break;
      indent++;
    }

    function skipIndent() {
      var skip = indent;
      while (ch && ch <= ' ' && ch !== '\n' && skip-- > 0) next();
    }

    // skip white/to (newline)
    while (ch && ch <= ' ' && ch !== '\n') next();
    if (ch === '\n') { next(); skipIndent(); }

    // When parsing multiline string values, we must look for ' characters.
    while (true) {
      if (!ch) {
        error("Bad multiline string");
      } else if (ch === '\'') {
        triple++;
        next();
        if (triple === 3) {
          if (string.slice(-1) === '\n') string=string.slice(0, -1); // remove last EOL
          return string;
        } else continue;
      } else {
        while (triple > 0) {
          string += '\'';
          triple--;
        }
      }
      if (ch === '\n') {
        string += '\n';
        next();
        skipIndent();
      } else {
        if (ch !== '\r') string += ch;
        next();
      }
    }
  }

  function keyname() {
    // quotes for keys are optional in Hjson
    // unless they include {}[],: or whitespace.

    if (ch === '"') return string();

    var name = "", start = at, space = -1;
    while (true) {
      if (ch === ':') {
        if (!name) error("Found ':' but no key name (for an empty key name use quotes)");
        else if (space >=0 && space !== name.length) { at = start + space; error("Found whitespace in your key name (use quotes to include)"); }
        return name;
      } else if (ch <= ' ') {
        if (!ch) error("Found EOF while looking for a key name (check your syntax)");
        else if (space < 0) space = name.length;
      } else if (isPunctuatorChar(ch)) {
        error("Found '" + ch + "' where a key name was expected (check your syntax or use quotes if the key name includes {}[],: or whitespace)");
      } else {
        name += ch;
      }
      next();
    }
  }

  function white() {
    while (ch) {
      // Skip whitespace.
      while (ch && ch <= ' ') next();
      // Hjson allows comments
      if (ch === '#' || ch === '/' && peek(0) === '/') {
        while (ch && ch !== '\n') next();
      } else if (ch === '/' && peek(0) === '*') {
        next(); next();
        while (ch && !(ch === '*' && peek(0) === '/')) next();
        if (ch) { next(); next(); }
      } else break;
    }
  }

  function tfnns() {
    // Hjson strings can be quoteless
    // returns string, true, false, or null.
    var value = ch;
    if (isPunctuatorChar(ch))
      error("Found a punctuator character '" + ch + "' when expecting a quoteless string (check your syntax)");

    for(;;) {
      next();
      if (value.length === 3 && value === "'''") return mlString();
      var isEol = ch === '\r' || ch === '\n' || ch === '';
      if (isEol ||
        ch === ',' || ch === '}' || ch === ']' ||
        ch === '#' ||
        ch === '/' && (peek(0) === '/' || peek(0) === '*')
        ) {
        // this tests for the case of {true|false|null|num}
        // followed by { ',' | '}' | ']' | '#' | '//' | '/*' }
        // which needs to be parsed as the specified value
        var chf = value[0];
        switch (chf) {
          case 'f': if (value.trim() === "false") return false; break;
          case 'n': if (value.trim() === "null") return null; break;
          case 't': if (value.trim() === "true") return true; break;
          default:
            if (chf === '-' || chf >= '0' && chf <= '9') {
              var n = tryParseNumber(value);
              if (n !== undefined) return dsf(value, n);
            }
        }
        if (isEol) {
          // remove any whitespace at the end (ignored in quoteless strings)
          value = value.trim();
          return dsf(value, value);
        }
      }
      value += ch;
    }
  }

  function getComment(wat) {
    var i;
    wat--;
    // remove trailing whitespace
    for (i = at - 2; i > wat && text[i] <= ' ' && text[i] !== '\n'; i--);
    // but only up to EOL
    if (text[i] === '\n') i--;
    if (text[i] === '\r') i--;
    var res = text.substr(wat, i-wat+1);
    for (i = 0; i < res.length; i++)
      if (res[i] > ' ') return res;
    return "";
  }

  function errorClosingHint(value) {
    function search(value, ch) {
      var i, k, length, res;
      switch (typeof value) {
        case 'string':
          if (value.indexOf(ch) >= 0) res=value;
          break;
        case 'object':
          if (Object.prototype.toString.apply(value) === '[object Array]') {
            for (i = 0, length = value.length; i < length; i++) {
              res=search(value[i], ch) || res;
            }
          } else {
            for (k in value) {
              if (!Object.prototype.hasOwnProperty.call(value, k)) continue;
              res=search(value[k], ch) || res;
            }
          }
      }
      return res;
    }

    function report(ch) {
      var possibleErr=search(value, ch);
      if (possibleErr) {
        return "found '"+ch+"' in a string value, your mistake could be with:\n"+
          "  > "+possibleErr+"\n"+
          "  (unquoted strings contain everything up to the next line!)";
      } else return "";
    }

    return report('}') || report(']');
  }

  function array() {
    // Parse an array value.
    // assuming ch === '['

    var array = [];
    var kw, wat;
    try {
      if (keepWsc) {
        if (Object.defineProperty) Object.defineProperty(array, "__WSC__", { enumerable: false, writable: true });
        array.__WSC__ = kw = [];
      }

      next();
      wat = at;
      white();
      if (kw) kw.push(getComment(wat));
      if (ch === ']') {
        next();
        return array;  // empty array
      }

      while (ch) {
        array.push(value());
        wat = at;
        white();
        // in Hjson the comma is optional and trailing commas are allowed
        if (ch === ',') { next(); wat = at; white(); }
        if (kw) kw.push(getComment(wat));
        if (ch === ']') {
          next();
          return array;
        }
        white();
      }

      error("End of input while parsing an array (missing ']')");
    } catch (e) {
      e.hint=e.hint||errorClosingHint(array);
      throw e;
    }
  }

  function object(withoutBraces) {
    // Parse an object value.

    var key, object = {};
    var kw, wat;
    function pushWhite(key) { kw.c[key]=getComment(wat); if (key) kw.o.push(key); }

    try {
      if (keepWsc) {
        if (Object.defineProperty) Object.defineProperty(object, "__WSC__", { enumerable: false, writable: true });
        object.__WSC__ = kw = { c: {}, o: []  };
        if (withoutBraces) kw.noRootBraces = true;
      }

      if (!withoutBraces) {
        // assuming ch === '{'
        next();
        wat = at;
      } else wat = 1;

      white();
      if (kw) pushWhite("");
      if (ch === '}' && !withoutBraces) {
        next();
        return object;  // empty object
      }
      while (ch) {
        key = keyname();
        white();
        if (ch !== ':') error("Expected ':' instead of '" + ch + "'");
        next();
        // duplicate keys overwrite the previous value
        object[key] = value();
        wat = at;
        white();
        // in Hjson the comma is optional and trailing commas are allowed
        if (ch === ',') { next(); wat = at; white(); }
        if (kw) pushWhite(key);
        if (ch === '}' && !withoutBraces) {
          next();
          return object;
        }
        white();
      }

      if (withoutBraces) return object;
      else error("End of input while parsing an object (missing '}')");
    } catch (e) {
      e.hint=e.hint||errorClosingHint(object);
      throw e;
    }
  }

  function value() {
    // Parse a Hjson value. It could be an object, an array, a string, a number or a word.

    white();
    switch (ch) {
      case '{': return object();
      case '[': return array();
      case '"': return string();
      default: return tfnns();
    }
  }

  function checkTrailing(v) {
    white();
    if (ch) error("Syntax error, found trailing characters");
    return v;
  }

  function rootValue() {
    // Braces for the root object are optional
    white();
    switch (ch) {
      case '{': return checkTrailing(object());
      case '[': return checkTrailing(array());
    }

    try {
      // assume we have a root object without braces
      return checkTrailing(object(true));
    } catch (e) {
      // test if we are dealing with a single JSON value instead (true/false/null/num/"")
      resetAt();
      try { return checkTrailing(value()); }
      catch (e2) { throw e; } // throw original error
    }
  }

  function hjsonParse(source, opt) {
    if (opt && typeof opt === 'object') {
      keepWsc = opt.keepWsc;
      dsf = hjsonOpt.loadDsf(opt.dsf, true);
    }
    else dsf = hjsonOpt.loadDsf(null, true);
    text = source;
    resetAt();
    return rootValue();
  }

  return hjsonParse($source, $opt);
};
