/* Hjson http://hjson.org */
/* jslint node: true */
"use strict";

var common = require("./hjson-common");

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
        if (parse) {
          return x.parse.apply(null, arguments);
        } else {
          var res=x.stringify.apply(null, arguments);
          // check result
          if (res !== undefined && (typeof res !== "string" ||
            res[0] === '"' ||
            [].some.call(res, function(c) { return isInvalidDsfChar(c); })))
            throw new Error("value may not start with a quote or contain a punctuator character except colon: " + res);
          return res;
        }
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

function isInvalidDsfChar(c) {
  return c === '{' || c === '}' || c === '[' || c === ']' || c === ',';
}


function math(opt) {
  return {
    name: "math",
    parse: function (value) {
      switch (value) {
        case "+inf":
        case "inf":
        case "+Inf":
        case "Inf": return Infinity;
        case "-inf":
        case "-Inf": return -Infinity;
        case "-0": return -0;
        case "nan":
        case "NaN": return NaN;
      }
    },
    stringify: function (value) {
      if (typeof value !== 'number') return;
      if (1 / value === -Infinity) return "-0"; // 0 === -0
      if (value === Infinity) return "Inf";
      if (value === -Infinity) return "-Inf";
      if (isNaN(value)) return "NaN";
    },
  };
}
math.description="support for Inf/inf, -Inf/-inf, Nan/naN and -0";

function hex(opt) {
  var out=opt && opt.out;
  return {
    name: "hex",
    parse: function (value) {
      if (/^0x[0-9A-Fa-f]+$/.test(value))
        return parseInt(value, 16);
    },
    stringify: function (value) {
      if (out && Number.isInteger(value))
        return "0x"+value.toString(16);
    },
  };
}
hex.description="parse hexadecimal numbers prefixed with 0x";

function date(opt) {
  return {
    name: "date",
    parse: function (value) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        /^\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}(?:.\d+)(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
        var dt = Date.parse(value);
        if (!isNaN(dt)) return new Date(dt);
      }
    },
    stringify: function (value) {
      if (Object.prototype.toString.call(value) === '[object Date]') {
        var dt = value.toISOString();
        if (dt.indexOf("T00:00:00.000Z", dt.length - 14) !== -1) return dt.substr(0, 10);
        else return dt;
      }
    },
  };
}
date.description="support ISO dates";

module.exports = {
  loadDsf: loadDsf,
  std: {
    math: math,
    hex: hex,
    date: date,
  },
};
