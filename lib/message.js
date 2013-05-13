'use strict';

// TODO マッチングをまじめにする
// prefix がセットされたらuser/nick/hostを更新

var NumericReply = require('./numeric_reply');

function Message(prefix, command, params) {
    this.prefix = prefix;
    this.command = command;
    this.params = params; // Array

    this.parseUser();
    this.parseServer();
}

Message.parse = function(raw) {
    var m;

    m = raw.match(/^(?::([^ ]+)[ ]+)?([^ ]+)(.*)/);
    var prefix = m[1];
    var command = m[2];
    if (command.match(/^\d\d\d$/)) { // numeric reply
        command = NumericReply[ command ] || command;
    }

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

Message.prototype.toRaw = function() {
    var result = '';

    if (this.prefix) {
        result += ':' + this.prefix + ' ';
    }

    result += this.command + ' ';

    var trailing = this.params[ this.params.length - 1];
    if (trailing.match(/\s/) || trailing === '') {
        this.params[ this.params.length - 1]  = ':' + trailing;
    }

    result += this.params.join(' ');
    result += "\r\n";

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
