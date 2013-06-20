'use strict';

var LogBuffer = {
    init : function( options ) {
        this.name = options.name;
        this.size = options.size || 30;

        this.buffers = {};
    },
    handleBouncer : function( bouncer ) {
        this.buffers[ bouncer.name ] = {};

        bouncer.on( 'sync', (function(session) {
            console.dir( bouncer.network.channels );
            Object.keys( this.buffers[ bouncer.name ] ).forEach( (function( target ) {
                if ( this.buffers[ bouncer.name ][ target ] ) {
                    this.buffers[ bouncer.name ][ target ].forEach( (function( text ) {
                        session.send( session.serverName, 'NOTICE', [ target, text ] );
                    }).bind(this) );
                }
            }).bind(this) );
        }).bind(this) );
    },
    handleNetwork : function( bouncer, network ) {
        network.on( 'privmsg', (function(message) {
            this.bufferLog(bouncer.name, '<' + message.nick + '> ' + message.params[1], message.params[0]);
        }).bind(this) );
        network.on( 'notice', (function(message) {
            this.bufferLog(bouncer.name, '-' + message.nick + '- ' + message.params[1], message.params[0]);
        }).bind(this) );
    },
    handleSession : function( bouncer, session ) {
        session.on( 'privmsg', (function(message) {
            this.bufferLog(bouncer.name, '<' + session.nick + '> ' + message.params[1], message.params[0]);
        }).bind(this) );
        session.on( 'notice', (function(message) {
            this.bufferLog(bouncer.name, '-' + session.nick + '- ' + message.params[1], message.params[0]);
        }).bind(this) );
    },
    bufferLog : function( bouncerName, text, target ) {
        if (!this.buffers[ bouncerName ][ target ]) {
            this.buffers[ bouncerName ][ target ] = [];
        }
        if (this.buffers[ bouncerName ][ target ].length >= this.size) {
            this.buffers[ bouncerName ][ target ].shift();
        }

        var date = new Date();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds  = date.getSeconds();

        this.buffers[ bouncerName ][ target ].push( 
            [
                ( hours   < 10 ? '0' + hours    : hours    ),
                ( minutes < 10 ? '0' + minutes  : minutes  ),
                ( seconds < 10 ? '0' + seconds  : seconds  )
            ].join(':') + ' ' + text
        );
    }
};

module.exports = LogBuffer;

