'use strict';

var irc = require('../irc');

function Bouncer(options) {
    this.network = null;
    this.networkOptions = options.networkOptions;

    this.sessions = [];
}

Bouncer.prototype.connect = function() {
    this.network = new irc.Client( this.networkOptions );
    this.network.on('raw', (function(message) {
        this.onNetworkMessage(message);
    }).bind(this));
    this.network.connect();
};

Bouncer.prototype.attach = function(session) {
    session.on('raw', (function(message) {
        this.onSessionMessage(message, session);
    }).bind(this));

    this.sessions.push( session );
};

Bouncer.prototype.onSessionMessage = function(message, session) {
    var forward = false;

    switch( message.command ) {
        default :
            forward = true;
            break;
    };
 
    if (forward) {
        this.network.send( 
            ( irc.NumericReply.numFor( message.command ) || message.command ),
            message.params
        );
    }
};

Bouncer.prototype.onNetworkMessage = function(message) {
    var forward = false;

    switch( message.command ) {
        case 'PING' : // processed by irc.Client
            forward = false;
            break;
        case 'PONG' : // ignored
            forward = false;
            break;
        default :
            forward = true;
            break;
    };

    if (forward) {
        this.sessions.forEach( (function(session) {
            session.send( 
                message.prefix,
                ( irc.NumericReply.numFor( message.command ) || message.command ),
                message.params
            );
        }).bind(this) );
    }
};

module.exports = Bouncer;
