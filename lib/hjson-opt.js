/* Hjson http://hjson.org */
/* jslint node: true */
"use strict";

var os=require('os'); // will be {} when used in a browser

function loadDsf(col, parse) {

  if (Object.prototype.toString.apply(col) !== '[object Array]') {
    if (col) throw new Error("dsf option must contain an array!");
    else return nopDsf;
  } else if (col.length === 0) return nopDsf;

  var dsf = [];
  function isFunction(f) { return {}.toString.call(f) === '[object Function]'; }

  col.forEach(function(x) {
    if (!x.name || !isFunction(x.parse) || !isFunction(x.stringify))
      throw new Error("extension does not match the DSF interface");
    dsf.push(function() {
      try {
        return (parse?x.parse:x.stringify).apply(null, arguments);
      } catch (e) {
        throw new Error("DSF-"+x.name+" failed; "+e.message);
      }
    });
  });

  return runDsf.bind(null, dsf);
}

function runDsf(dsf, value, value2) {
  if (dsf) {
    for (var i = 0; i < dsf.length; i++) {
      var res = dsf[i](value);
      if (res !== undefined) return res;
    }
  }
  return value2;
}

function nopDsf(value, value2) {
  return value2;
}

module.exports = {
  EOL: os.EOL || '\n',
  loadDsf: loadDsf,
};
