'use strict';

function Message(raw) {
    this.raw = raw;
    this.parse();
}

Message.prototype.parse = function() {
    var m = this.raw.match(/^(?::([^ ]+)[ ]+)?([^ ]+)(.*)/);

    this.prefix = m[1];
    this.command = m[2];

    this.parseParams(m[3]);

    this.parseUser();
    this.parseServer();
}

Message.prototype.parseParams = function(rawParams) {
    var m = rawParams.trim().match(/^(.*?)(?:^|\s+):(.*)$/);

    var middle = (m ? m[1] : rawParams).trim();
    var trailing = m ? m[2] : null;
    this.params = middle === '' ? [] : middle.split(' ');
    if (trailing) {
        this.params.push(trailing);
    }
};

Message.prototype.parseUser = function() {
    if (!this.prefix) { return; }

    var m;
    m = this.prefix.match(/^(\S+?)!/);
    if (m) { this.nick = m[1]; }
    m = this.prefix.match(/!(\S+?)@/);
    if (m) { this.user = m[1]; }
    m = this.prefix.match(/@(\S+)$/);
    if (m) { this.host = m[1]; }
}

Message.prototype.parseServer = function() {
    if (!this.prefix) { return; }

    if (/[!@]/.test(this.prefix)) { return; }
    this.server = this.prefix;
};

module.exports = Message;
