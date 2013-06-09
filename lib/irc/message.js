'use strict';

var Iconv = require('iconv').Iconv;

// TODO マッチングをまじめにする

function Message(prefix, command, params) {
    this.prefix = prefix;
    this.command = command;
    this.params = params || []; // Array

    this.parseUser();
    this.parseServer();
}

Message.parse = function(raw, encoding) {
    if (encoding) {
        var iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE');
        raw = iconv.convert(raw).toString();
    }

    var m;

    m = raw.match(/^(?::([^ ]+)[ ]+)?([^ ]+)(.*)/);
    var prefix = m[1];
    var command = m[2];

    var rawParams = m[3];
    m = rawParams.trim().match(/^(.*?)(?:^|\s+):(.*)$/);
    var middle = (m ? m[1] : rawParams).trim();
    var trailing = m ? m[2] : null;
    var params = middle === '' ? [] : middle.split(' ');
    if (trailing) {
        params.push(trailing);
    }

    return new Message( prefix, command, params );
}

Message.prototype.toRaw = function(encoding) {
    var result = '';

    if (this.prefix) {
        result += ':' + this.prefix + ' ';
    }

    result += this.command + ' ';

    var params = this.params.concat();
    var trailing = params[ params.length - 1];
    if (
           typeof(trailing) !== 'undefined' 
        && (trailing.match(/\s/) || trailing === '')
    ) {
        params[ params.length - 1]  = ':' + trailing;
    }

    result += params.join(' ');
    result += "\r\n";

    if (encoding) {
        var iconv = new Iconv('UTF-8', encoding + '//TRANSLIT//IGNORE');
        result = iconv.convert(result).toString();
    }

    return result;
};

Message.prototype.parseUser = function() {
    if (!this.prefix) { return; }

    var m;
    m = this.prefix.match(/^(\S+?)(?:!|$)/);
    if (m) { this.nick = m[1]; }
    m = this.prefix.match(/!(\S+?)(?:@|$)/);
    if (m) { this.user = m[1]; }
    m = this.prefix.match(/@(\S+)$/);
    if (m) { this.host = m[1]; }
};

Message.prototype.parseServer = function() {
    if (!this.prefix) { return; }

    if (/[!@]/.test(this.prefix)) { return; }
    this.server = this.prefix;
};

module.exports = Message;
