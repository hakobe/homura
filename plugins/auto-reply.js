'use strict';

var AutoReply = Object.create({
    init : function( options ) {
        this.name = options.name;
        this.options = options;
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
                [ message.nick, ( this.options.message || "Sorry, I am away from IRC.") ]
            );
        }).bind(this));
    },
    handleSession : function( bouncer, session ) {
        // nop
    },
});

module.exports = AutoReply;
