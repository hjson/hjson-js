/* Hjson http://hjson.org */
/* jslint node: true */
"use strict";

var os=require('os'); // will be {} when used in a browser

module.exports = {
  EOL: os.EOL || '\n',
};
