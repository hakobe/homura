'use strict';

function AutoReply(options) {
    this.name = options.name;
    this.message = options.message;
}

AutoReply.prototype.handleNetwork = function( network, bouncer ) {
    network.on('privmsg', (function( message ) {
        if (message.params[0] != network.nick) {
            return;
        }
        if (bouncer.isAttached()) {
            return;
        }

        network.send(
            'NOTICE',
            [ message.nick, ( this.message || "Sorry, I am away from IRC.") ]
        );
    }).bind(this));
};

module.exports = AutoReply;
