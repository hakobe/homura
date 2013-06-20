'use strict';

function AutoJoin(options) {
    this.name = options.name;
    this.channels = options.channels || {};
}

AutoJoin.prototype.handleNetwork = function( network, bouncer ) {
    var channels = this.channels[ bouncer.name ];
    if (channels) {
        channels.forEach( function(channel) {
            network.on( 'register', (function() {
                network.send('JOIN', [ channel ]);
            }) );
        } );
    }
};

module.exports = AutoJoin;

