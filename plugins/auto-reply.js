'use strict';

var AutoReply = {
    init : function( options ) {
        this.name = options.name;
        this.message = options.message;
    },
    handleNetwork : function( bouncer, network ) {
        network.on('privmsg', (function( message ) {
            if (message.params[0] != network.nick) {
                return;
            }
            if (!bouncer.isAttached()) {
                return;
            }

            var command = this.options.notice ? 'NOTICE' : 'PRIVMSG';
            network.send(
                'NOTICE',
                [ message.nick, ( this..message || "Sorry, I am away from IRC.") ]
            );
        }).bind(this));
    },
};

module.exports = AutoReply;
