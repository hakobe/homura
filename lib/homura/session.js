'use strict';

var util = require('util');
var irc = require('../irc');
var Log = require('../util/log');

function Session(connection) {

    irc.Session.call(this, connection);

    this.active = false;
    this.serverName = 'homura-chan';

    this.on('raw', (function(message) {
        if (message.command.match(/^(?:PASS|NICK|USER|QUIT)$/)) {
            // nop
        }
        else if (this.active) {
            Log.debug('<homura.Session> forwarding message: ' + message.toRaw());
            this.emit('forward', message);
        }
    }).bind(this));
};

util.inherits(Session, irc.Session);

Session.prototype.onUser = function(message) {
    var userNetworkName = message.params[0].split(/@/);
    this.user = userNetworkName[0];
    this.networkName = userNetworkName[1] || 'default';
    this.real = message.params[3];
    if (!this.nick) {
        this.nick = this.user;
    }
    this.host = this.connection.remoteAddress;
    this.prefix = this.nick + '!' + this.user + '@' + this.host;
    this.welcome();

    // 認証に成功すれば
    Log.debug('<homura.Session> connectiona activated');
    this.active = true;
    this.emit('active');
};

module.exports = Session;
