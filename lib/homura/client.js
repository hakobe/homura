'use strict';

var util = require('util');
var irc = require('../irc');
var Log = require('../util/log');

function Client(options) {
    this.registered = false;

    irc.Client.call(this, options);

    this.on('raw', function(message) {
        if (message.command.match(/^(?:PING|PONG)$/)) {
            // nop
        }
        else {
            Log.debug('<homura.Client> forwarding message: ' + message.toRaw());
            this.emit('forward', message);
        }
    });

    this.on('register', (function() {
        this.registered = true;
    }).bind(this));
    this.on('close', (function() {
        this.registered = false;
    }).bind(this));
}

util.inherits(Client, irc.Client);

Client.prototype.on433 = function() {
    // TODO check isupport
    var newNick = this.nick + '_';
    this.send('NICK', [ newNick ]);
    this.nick = newNick;
};

module.exports = Client;
