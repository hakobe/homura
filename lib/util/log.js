'use strict';

var util = require('util');

var Log = Object.create({
    error : function(tag, message) {
        if (this.level >= Log.ERROR) {
            this.log('ERROR', tag, message);
        }
    },
    warn : function(tag, message) {
        if (this.level >= Log.WARN) {
            this.log('WARN', tag, message);
        }
    },
    info : function(tag, message) {
        if (this.level >= Log.INFO) {
            this.log('INFO', tag, message);
        }
    },
    debug : function(tag,message) {
        if (this.level >= Log.DEBUG) {
            this.log('DEBUG', tag, message);
        }
    },
    log : function(lavel, tag, message) {
        message = message.replace(/\r\n$/, "");
        util.log( '[' + lavel + '] <' + tag + '> ' + message );
    }
});

Log.ERROR = 0;
Log.WARN  = 1;
Log.INFO  = 2;
Log.DEBUG = 3;

Log.level = Log.ERROR;

module.exports = Log;
