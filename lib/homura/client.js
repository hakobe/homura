'use strict';

var util = require('util');
var irc = require('../irc');
var Log = require('../util/log');

function Client(options) {
    this.registered = false;

    irc.Client.call(this, options);

    this.on('raw', (function(message) {
        if (message.command.match(/^(?:PING|PONG)$/)) {
            // nop
        }
        else {
            Log.debug(this.tagForLog(), "Forwarding message to bouncer: " + message.toRaw());
            this.emit('forward', message);
        }
    }).bind(this));

    this.on('register', (function() {
        this.registered = true;
    }).bind(this));
    this.on('close', (function() {
        this.registered = false;
    }).bind(this));
    this.emit('networkCreate', this.network);
}

util.inherits(Client, irc.Client);

Client.prototype.tagForLog = function() {
    return 'homura.Client' + '(' + this.nick + '!' + this.user + '@' + this.host + ')';
};

Client.prototype.on433 = function() {
    // Only when the client is not registered to IRC server, 433 messages are handled.
    if (this.registered) {
        return;
    }

    var nickLen = this.isupport.config.NICKLEN || 9;
    var newNick = this.nick + '_';

    if (newNick.length > nickLen) {
        newNick = newNick.slice(0, nickLen).replace(/.[_]*$/, function(match) {
            var substitute  = '';
            for (var i = 0, l = match.length; i < l; i++) {
                substitute += '_';
            }
            return substitute;
        });
    }

    this.send('NICK', [ newNick ]);
};

module.exports = Client;
