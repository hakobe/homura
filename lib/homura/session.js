'use strict';

var util = require('util');
var irc = require('../irc');
var Log = require('../util/log');

function Session(connection) {

    irc.Session.call(this, connection);

    this.attached = false;
    this.serverName = 'homura-chan';

    this.on('raw', (function(message) {
        if (this.attached) {
            if (message.command.match(/^(?:QUIT)$/)) {
                // nop
            }
            else {
                Log.debug('<homura.Session> forwarding message: ' + message.toRaw());
                this.emit('forward', message);
            }
        }
    }).bind(this));
};

util.inherits(Session, irc.Session);

Session.prototype.notifyAttached = function() {
    this.attached = true;
};

Session.prototype.onUser = function(message) {
    var userBouncer = message.params[0].split(/@/);
    this.user = userBouncer[0];
    this.bouncerName = userBouncer[1] || 'default';
    this.real = message.params[3];
    if (!this.nick) {
        this.nick = this.user;
    }
    this.host = this.connection.remoteAddress;

    // 認証に成功すれば
    Log.debug('<homura.Session> connection activated');
    this.emit('auth');
};

module.exports = Session;
