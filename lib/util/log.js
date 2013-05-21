'use strict';

var util = require('util');

var Log = Object.create({
    error : function(message) {
        if (this.level >= Log.ERROR) {
            this.log('ERROR', message);
        }
    },
    warn : function(message) {
        if (this.level >= Log.WARN) {
            this.log('WARN', message);
        }
    },
    info : function(message) {
        if (this.level >= Log.INFO) {
            this.log('INFO', message);
        }
    },
    debug : function(message) {
        if (this.level >= Log.DEBUG) {
            this.log('DEBUG', message);
        }
    },
    log : function(lavel, message) {
        message = message.replace(/\r\n$/, "");
        util.log( '[' + lavel + '] ' + message );
    }
});

Log.ERROR = 0;
Log.WARN  = 1;
Log.INFO  = 2;
Log.DEBUG = 3;

Log.level = Log.ERROR;

module.exports = Log;
