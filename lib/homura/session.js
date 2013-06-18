'use strict';

var util = require('util');
var irc = require('../irc');
var Log = require('../util/log');

function Session(connection) {

    irc.Session.call(this, connection);

    this.attached = false;
    this.serverName = 'homura-chan';
};

util.inherits(Session, irc.Session);

Session.prototype.tagForLog = function() {
    return 'homura.Session' + 
        ( ( this.prefix || this.bouncerName  ) ?
            '(' + 
                ( this.prefix || '') +
                ( this.bouncerName ? ('~' + this.bouncerName) : '') +
            ')' : '' );
};

Session.prototype.notifyAttached = function() {
    Log.debug(this.tagForLog(), 'Attached to bouncer');
    this.attached = true;
};

Session.prototype.onMessage = function(message) {
    if (this.attached) {
        if (message.command.match(/^(?:QUIT)$/)) {
            // nop
        }
        else {
            Log.debug(this.tagForLog(), "Forwarding message to bouncer: " + message.toRaw());
            this.emit('forward', message);
        }
    }
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

    Log.debug(this.tagForLog(), 'Connection activated');
    process.nextTick( (function() {
        this.emit('requestauth');
    }).bind(this) );
};

module.exports = Session;
