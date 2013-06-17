'use strict';

var AutoReply = {
    init : function( options ) {
        this.name = options.name;
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
};

module.exports = AutoReply;
