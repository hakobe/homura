'use strict';

var util = require('util');
var irc = require('../irc');
var Log = require('../util/log');

function Client(options) {
    this.registered = false;

    irc.Client.call(this, options);

    this.on('register', (function() {
        this.registered = true;
    }).bind(this));
    this.on('close', (function() {
        Log.debug(this.tagForLog(), "Closing and make registered false");
        this.registered = false;
    }).bind(this));
}

util.inherits(Client, irc.Client);

Client.prototype.tagForLog = function() {
    return 'homura.Client' + '(' + this.nick + '!' + this.user + '@' + this.host + ')';
};

Client.prototype.onMessage = function(message) {
    if (message.command.match(/^(?:PING|PONG|433)$/)) {
        // nop
    }
    else {
        Log.debug(this.tagForLog(), "Forwarding message to bouncer: " + message.toRaw());
        this.emit('forward', message);
    }
};

Client.prototype.on433 = function(message) {
    var usedNick = message.params[1];

    // TODO use another symbol when new nickname can't be created using _.
    var nickLen = this.isupport.config.NICKLEN || 9;
    var newNick = usedNick + '_';

    if (newNick.length > nickLen ) {
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
