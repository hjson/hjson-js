/* Hjson http://hjson.org */
/* jslint node: true */
"use strict";

module.exports = function($value, $opt) {

  var common = require("./hjson-common");
  var dsf = require("./hjson-dsf");

  var runDsf; // domain specific formats

  // needsEscape tests if the string can be written without escapes
  var needsEscape = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  // needsQuotes tests if the string can be written as a quoteless string (includes needsEscape but without \\ and \")
  var needsQuotes = /^\s|^"|^'''|^#|^\/\*|^\/\/|^\{|^\}|^\[|^\]|^:|^,|\s$|[\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  // needsEscapeML tests if the string can be written as a multiline string (includes needsEscape but without \n, \r, \\ and \")
  var needsEscapeML = /'''|[\x00-\x09\x0b\x0c\x0e-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  // starts with a keyword and optionally is followed by a comment
  var startsWithKeyword = /^(true|false|null)\s*((,|\]|\}|#|\/\/|\/\*).*)?$/;
  var meta =
  {  // table of character substitutions
    '\b': 'b',
    '\t': 't',
    '\n': 'n',
    '\f': 'f',
    '\r': 'r',
    '"' : '"',
    '\\': '\\'
  };
  var needsEscapeName = /[,\{\[\}\]\s:#"]|\/\/|\/\*|'''/;
  var gap = '';
  var indent = '  ';
  // options
  var eol, keepComments, bracesSameLine, quoteAlways;
  var token = {
    obj:  [ '{', '}' ],
    arr:  [ '[', ']' ],
    key:  [ '',  '' ],
    qkey: [ '"', '"' ],
    col:  [ ':' ],
    str:  [ '', '' ],
    qstr: [ '"', '"' ],
    mstr: [ "'''", "'''" ],
    num:  [ '', '' ],
    lit:  [ '', '' ],
    dsf:  [ '', '' ],
    esc:  [ '\\', '' ],
    uni:  [ '\\u', '' ],
    rem:  [ '', '' ],
  };

  function wrap(tk, v) { return tk[0] + v + tk[1]; }

  function quoteReplace(string) {
    return string.replace(needsEscape, function (a) {
      var c = meta[a];
      if (typeof c === 'string') return wrap(token.esc, c);
      else return wrap(token.uni, ('0000' + a.charCodeAt(0).toString(16)).slice(-4));
    });
  }

  function quote(string, gap, hasComment, isRootObject) {
    if (!string) return wrap(token.qstr, '');

    needsQuotes.lastIndex = 0;
    startsWithKeyword.lastIndex = 0;

    // Check if we can insert this string without quotes
    // see hjson syntax (must not parse as true, false, null or number)

    if (quoteAlways || hasComment ||
      needsQuotes.test(string) ||
      common.tryParseNumber(string, true) !== undefined ||
      startsWithKeyword.test(string)) {

      // If the string contains no control characters, no quote characters, and no
      // backslash characters, then we can safely slap some quotes around it.
      // Otherwise we first check if the string can be expressed in multiline
      // format or we must replace the offending characters with safe escape
      // sequences.

      needsEscape.lastIndex = 0;
      needsEscapeML.lastIndex = 0;
      if (!needsEscape.test(string)) return wrap(token.qstr, string);
      else if (!needsEscapeML.test(string) && !isRootObject) return mlString(string, gap);
      else return wrap(token.qstr, quoteReplace(string));
    } else {
      // return without quotes
      return wrap(token.str, string);
    }
  }

  function mlString(string, gap) {
    // wrap the string into the ''' (multiline) format

    var i, a = string.replace(/\r/g, "").split('\n');
    gap += indent;

    if (a.length === 1) {
      // The string contains only a single line. We still use the multiline
      // format as it avoids escaping the \ character (e.g. when used in a
      // regex).
      return wrap(token.mstr, a[0]);
    } else {
      var res = eol + gap + token.mstr[0];
      for (i = 0; i < a.length; i++) {
        res += eol;
        if (a[i]) res += gap + a[i];
      }
      return res + eol + gap + token.mstr[1];
    }
  }

  function quoteKey(name) {
    if (!name) return '""';

    // Check if we can insert this key without quotes

    if (needsEscapeName.test(name)) {
      needsEscape.lastIndex = 0;
      return wrap(token.qkey, needsEscape.test(name) ? quoteReplace(name) : name);
    } else {
      // return without quotes
      return wrap(token.key, name);
    }
  }

  function str(value, hasComment, noIndent, isRootObject) {
    // Produce a string from value.

    function startsWithNL(str) { return str && str[str[0] === '\r' ? 1 : 0] === '\n'; }
    function commentOnThisLine(str) { return str && !startsWithNL(str); }
    function makeComment(str, prefix, trim) {
      if (!str) return "";
      str = common.forceComment(str);
      var i, len = str.length;
      for (i = 0; i < len && str[i] <= ' '; i++) {}
      if (trim && i > 0) str = str.substr(i);
      if (i < len) return prefix + wrap(token.rem, str);
      else return str;
    }

    // What happens next depends on the value's type.

    // check for DSF
    var dsfValue = runDsf(value);
    if (dsfValue !== undefined) return wrap(token.dsf, dsfValue);

    switch (typeof value) {
      case 'string':
        return quote(value, gap, hasComment, isRootObject);

      case 'number':
        // JSON numbers must be finite. Encode non-finite numbers as null.
        return isFinite(value) ? wrap(token.num, String(value)) : wrap(token.lit, 'null');

      case 'boolean':
        return wrap(token.lit, String(value));

      case 'object':
        // If the type is 'object', we might be dealing with an object or an array or
        // null.

        // Due to a specification blunder in ECMAScript, typeof null is 'object',
        // so watch out for that case.

        if (!value) return wrap(token.lit, 'null');

        var comments; // whitespace & comments
        if (keepComments) comments = common.getComment(value);

        var isArray = Object.prototype.toString.apply(value) === '[object Array]';

        // Make an array to hold the partial results of stringifying this object value.
        var mind = gap;
        gap += indent;
        var eolMind = eol + mind;
        var eolGap = eol + gap;
        var prefix = noIndent || bracesSameLine ? '' : eolMind;
        var partial = [];

        var i, length; // loop
        var k, v; // key, value
        var c, ca;

        if (isArray) {
          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.

          for (i = 0, length = value.length; i < length; i++) {
            if (comments) {
              c = comments.a[i]||[];
              ca = commentOnThisLine(c[1]);
              partial.push(makeComment(c[0], "\n") + eolGap);
            }
            partial.push(str(value[i], comments ? ca : false, true) || wrap(token.lit, 'null'));
            if (comments && c[1]) partial.push(makeComment(c[1], ca ? " " : "\n", ca));
          }

          if (comments) {
            if (length === 0) {
              // when empty
              partial.push((comments.e ? makeComment(comments.e[0], "\n") : "") + eolMind);
            }
            else partial.push(eolMind);
          }

          // Join all of the elements together, separated with newline, and wrap them in
          // brackets.

          if (comments) v = prefix + wrap(token.arr, partial.join(''));
          else if (partial.length === 0) v = wrap(token.arr, '');
          else v = prefix + wrap(token.arr, eolGap + partial.join(eolGap) + eolMind);
        } else {
          // Otherwise, iterate through all of the keys in the object.

          if (comments) {
            var keys = comments.o.slice();
            for (k in value) {
              if (Object.prototype.hasOwnProperty.call(value, k) && keys.indexOf(k) < 0)
                keys.push(k);
            }

            for (i = 0, length = keys.length; i < length; i++) {
              k = keys[i];
              c = comments.c[k]||[];
              ca = commentOnThisLine(c[1]);
              partial.push(makeComment(c[0], "\n") + eolGap);

              v = str(value[k], ca);
              if (v) partial.push(quoteKey(k) + token.col + (startsWithNL(v) ? '' : ' ') + v);
              if (comments && c[1]) partial.push(makeComment(c[1], ca ? " " : "\n", ca));
            }
            if (length === 0) {
              // when empty
              partial.push((comments.e ? makeComment(comments.e[0], "\n") : "") + eolMind);
            }
            else partial.push(eolMind);

          } else {
            for (k in value) {
              if (Object.prototype.hasOwnProperty.call(value, k)) {
                v = str(value[k]);
                if (v) partial.push(quoteKey(k) + token.col + (startsWithNL(v) ? '' : ' ') + v);
              }
            }
          }

          // Join all of the member texts together, separated with newlines
          if (partial.length === 0) {
            v = wrap(token.obj, '');
          } else {
            // and wrap them in braces
            if (comments) v = prefix + wrap(token.obj, partial.join(''));
            else v = prefix + wrap(token.obj, eolGap + partial.join(eolGap) + eolMind);
          }
        }

        gap = mind;
        return v;
    }
  }

  function hjsonStringify(value, opt) {
    var i, space;
    var dsfDef = null;

    eol = common.EOL;
    indent = '  ';
    keepComments = false;
    bracesSameLine = false;
    quoteAlways = false;

    if (opt && typeof opt === 'object') {
      if (opt.eol === '\n' || opt.eol === '\r\n') eol = opt.eol;
      space = opt.space;
      keepComments = opt.keepWsc;
      bracesSameLine = opt.bracesSameLine;
      quoteAlways = opt.quotes === 'always';
      dsfDef = opt.dsf;

      if (opt.colors === true) {
        token = {
          obj:  [ '\x1b[30;1m{\x1b[0m', '\x1b[30;1m}\x1b[0m' ],
          arr:  [ '\x1b[30;1m[\x1b[0m', '\x1b[30;1m]\x1b[0m' ],
          key:  [ '\x1b[33m',  '\x1b[0m' ],
          qkey: [ '\x1b[33m"', '"\x1b[0m' ],
          col:  [ '\x1b[37m:\x1b[0m' ],
          str:  [ '\x1b[37;1m', '\x1b[0m' ],
          qstr: [ '\x1b[37;1m"', '"\x1b[0m' ],
          mstr: [ "\x1b[37;1m'''", "'''\x1b[0m" ],
          num:  [ '\x1b[36;1m', '\x1b[0m' ],
          lit:  [ '\x1b[36m', '\x1b[0m' ],
          dsf:  [ '\x1b[37m', '\x1b[0m' ],
          esc:  [ '\x1b[31m\\', '\x1b[0m' ],
          uni:  [ '\x1b[31m\\u', '\x1b[0m' ],
          rem:  [ '\x1b[30;1m', '\x1b[0m' ],
        };
      }
    }

    runDsf = dsf.loadDsf(dsfDef, 'stringify');

    // If the space parameter is a number, make an indent string containing that
    // many spaces. If it is a string, it will be used as the indent string.

    if (typeof space === 'number') {
      indent = '';
      for (i = 0; i < space; i++) indent += ' ';
    } else if (typeof space === 'string') {
      indent = space;
    }

    var res = "";
    var comments = keepComments ? comments = (common.getComment(value) || {}).r : null;
    if (comments && comments[0]) res = comments[0] + '\n';

    // get the result of stringifying the value.
    res += str(value, null, true, true);

    if (comments) res += comments[1]||"";

    return res;
  }

  return hjsonStringify($value, $opt);
};
