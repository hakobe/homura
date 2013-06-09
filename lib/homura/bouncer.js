'use strict';

var irc = require('../irc');
var Log = require('../util/log');
var Client = require('./client');

function Bouncer(options) {
    this.network = null;
    this.name = options.name || 'default';
    this.networkOptions = {
        server : options.server,
        port   : options.port,
        nick   : options.nick,
        user   : options.user,
        real   : options.real
    };
    this.networkRetryCount = 3;
    this.networkRetryDelay = 2000;

    this.sessions = [];
    this.waitingSessions = [];
}

Bouncer.prototype.connect = function() {
    if (!this.network) {
        this.network = new Client( this.networkOptions );
        this.network.on('forward', (function(message) {
            this.onNetworkMessage(message);
        }).bind(this));
        this.network.on('connect', (function(message) {
            this.networkRetryCount = 3;
        }).bind(this));
        this.network.on('register', (function(message) {
            this.onNetworkRegister();
        }).bind(this));
        this.network.on('close', (function(message) {
            this.network = null;
            setTimeout( (function() {
                if ( this.networkRetryCount > 0 ) {
                    Log.info('<homura.Bouncer> try reconnecting');
                    this.networkRetryCount -= 1;
                    this.connect
                }
            }).bind(this), this.networkRetryDelay);
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

    if (this.network && this.network.registered) {
        this.registerSession(session);
        this.applyNetworkStatus(session);
    }
    else {
        this.waitingSessions.push(session);
        this.connect();
    }
};

Bouncer.prototype.welcome = function(session) { // session におくのがいいかもしれない
    session.send(
        session.serverName,
        '001', // RPL_WELCOME
        [ session.nick, "Welcome to Internet Relay Network " + session.serverName ]
    );
}

Bouncer.prototype.onSessionMessage = function(message, session) {
    if (this.network && this.network.registered) {
        this.network.send( message.command, message.params);
    }
    else {
        Log.debug('<homura.Bouncer> buffering message: ' + message.toRaw());
        this.connect();
    }
};

Bouncer.prototype.onNetworkMessage = function(message) {
    this.sendToSessions( message.prefix, message.command, message.params );
};

Bouncer.prototype.onNetworkRegister = function() {
    // force the connecting session nick
    this.waitingSessions.forEach( (function(session) {
        this.registerSession(session);
    }).bind(this) );
    this.waitingSessions = [];
};

Bouncer.prototype.sendToSessions = function( prefix, command, params ) {
    this.sessions.forEach( (function(session) {
        session.send(prefix, command, params );
    }).bind(this) );
};

Bouncer.prototype.registerSession = function(session) {
    session.send(session.nick, 'NICK', [ this.network.nick ] );
    session.nick = this.network.nick;
    session.updatePrefix();
    this.sessions.push(session);
    this.welcome(session);
};

Bouncer.prototype.applyNetworkStatus = function(session) {
    for ( var channelName in this.network.channels ) {
        session.send( session.prefix, 'JOIN', [ channelName ]);
        // channelオブジェクトから RPL_NAMREPLY をおくるのがのぞましい
        this.network.send( 'NAMES', [ channelName ]);
    }
};

module.exports = Bouncer;
