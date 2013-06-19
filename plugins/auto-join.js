'use strict';

var AutoJoin = {
    init : function(options) {
        this.name = options.name;
        this.channels = options.channels || {};
    },
    handleNetwork : function( bouncer, network ) {
        var channels = this.channels[ bouncer.name ];
        if (channels) {
            channels.forEach( function(channel) {
                network.on( 'register', (function() {
                    network.send('JOIN', [ channel ]);
                }) );
            } );
        }
    },
};

module.exports = AutoJoin;

