'use strict';

var irc = require('../irc');
var Client = require('./client');

function Bouncer(options) {
    this.network = null;
    this.networkName = options.networkName || 'default';
    this.networkOptions = options.networkOptions;

    this.sessions = [];
}

Bouncer.prototype.connect = function() {
    if (!this.network) {
        this.network = new Client( this.networkOptions );
        this.network.on('forward', (function(message) {
            this.onNetworkMessage(message);
        }).bind(this));
        this.network.on('close', (function(message) {
            this.network = null;
        }).bind(this));
        this.network.connect();
    }
};

Bouncer.prototype.attach = function(session) {
    session.on('forward', (function(message) {
        this.onSessionMessage(message, session);
    }).bind(this));
    session.on('close', (function(message) {
        this.sessions.splice( this.sessions.indexOf( session ), 1 );
    }).bind(this));
    this.sessions.push( session );
};

Bouncer.prototype.onSessionMessage = function(message, session) {
    if (this.network) {
        this.network.send( 
            ( irc.NumericReply.numFor( message.command ) || message.command ),
            message.params
        );
    }
};

Bouncer.prototype.onNetworkMessage = function(message) {
    this.sessions.forEach( (function(session) {
        session.send( 
            message.prefix,
            ( irc.NumericReply.numFor( message.command ) || message.command ),
            message.params
        );
    }).bind(this) );
};

module.exports = Bouncer;
