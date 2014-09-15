'use strict';

function AutoJoin(options) {
    this.name = options.name;
    this.channels = options.channels || {};
}

AutoJoin.prototype.handleIrcClient = function( ircClient, bouncer ) {
    var channels = this.channels[ bouncer.name ];
    if (channels) {
        channels.forEach( function(channel) {
            ircClient.on( 'register', (function() {
                ircClient.send('JOIN', channel.split(' '));
            }) );
        } );
    }
};

module.exports = AutoJoin;

