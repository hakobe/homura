'use strict';

var LogBuffer = {
    init : function( options ) {
        this.name = options.name;
        this.size = options.size || 30;

        this.buffers = {};
    },
    handleBouncer : function( bouncer ) {
        bouncer.on( 'sync', (function(session) {
            console.dir( bouncer.network.channels );
            Object.keys( this.buffers ).forEach( (function( target ) {
                if ( this.buffers[ target ] ) {
                    this.buffers[ target ].forEach( (function( text ) {
                        session.send( session.serverName, 'NOTICE', [ target, text ] );
                    }).bind(this) );
                }
            }).bind(this) );
        }).bind(this) );
    },
    handleNetwork : function( bouncer, network ) {
        network.on( 'privmsg', (function(message) {
            this.bufferLog('<' + message.nick + '> ' + message.params[1], message.params[0]);
        }).bind(this) );
        network.on( 'notice', (function(message) {
            this.bufferLog('-' + message.nick + '- ' + message.params[1], message.params[0]);
        }).bind(this) );
    },
    handleSession : function( bouncer, session ) {
        session.on( 'privmsg', (function(message) {
            this.bufferLog('<' + session.nick + '> ' + message.params[1], message.params[0]);
        }).bind(this) );
        session.on( 'notice', (function(message) {
            this.bufferLog('-' + session.nick + '- ' + message.params[1], message.params[0]);
        }).bind(this) );
    },
    bufferLog : function( text, target ) {
        if (!this.buffers[ target ]) {
            this.buffers[ target ] = [];
        }
        if (this.buffers[ target ].length >= this.size) {
            this.buffers[ target ].shift();
        }

        var date = new Date();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds  = date.getSeconds();

        this.buffers[ target ].push( 
            [
                ( hours   < 10 ? '0' + hours    : hours    ),
                ( minutes < 10 ? '0' + minutes  : minutes  ),
                ( seconds < 10 ? '0' + seconds  : seconds  )
            ].join(':') + ' ' + text
        );
    }
};

module.exports = LogBuffer;

