'use strict';

var util = require('util');
var irc = require('../irc');
var Log = require('../util/log');

function Client(options) {
    this.active = false;

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

    this.on('connect', (function() {
        this.active = true;
    }).bind(this));
    this.on('close', (function() {
        this.active = false;
    }).bind(this));
}

util.inherits(Client, irc.Client);

module.exports = Client;
