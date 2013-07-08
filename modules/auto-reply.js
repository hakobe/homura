'use strict';

function AutoReply(options) {
    this.name = options.name;
    this.message = options.message;
}

AutoReply.prototype.handleIrcClient = function( ircClient, bouncer ) {
    ircClient.on('privmsg', (function( message ) {
        if (message.params[0] != ircClient.nick) {
            return;
        }
        if (bouncer.isAttached()) {
            return;
        }

        ircClient.send(
            'NOTICE',
            [ message.nick, ( this.message || "Sorry, I am away from IRC.") ]
        );
    }).bind(this));
};

module.exports = AutoReply;
