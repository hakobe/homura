'use strict';

var util = require('util');
var events = require('events');
var irc = require('../irc');
var Log = require('../util/log');
var Client = require('./client');

function Bouncer(options) {
    this.network = null;
    this.name = options.name || 'default';
    this.networkOptions = {
        host     : options.host,
        port     : options.port,
        nick     : options.nick,
        user     : options.user,
        real     : options.real,
        encoding : options.encoding,
        password : options.password,
        tls      : options.tls,
    };
    this.networkRetryCount = 3;
    this.networkRetryDelay = 2000;

    this.sessions = [];
    this.waitingSessions = [];

    this.initializeMessages = [];

    events.EventEmitter.call(this);
}

util.inherits( Bouncer, events.EventEmitter );

Bouncer.prototype.tagForLog = function() {
    return 'homura.Bouncer' + '(' + this.name + ')';
};

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
                    Log.info(this.tagForLog(), 'Try reconnecting');
                    this.networkRetryCount -= 1;
                    this.connect()
                }
            }).bind(this), this.networkRetryDelay);
            this.initializeMessages = [];
        }).bind(this));
        this.network.connect();

        this.emit('networkCreate', this.network);
    }
};

Bouncer.prototype.isAttached = function() {
    return this.sessions.length > 0;
};

Bouncer.prototype.requestAttach = function(session) {
    this.emit('sessionCreate', session);

    session.on('forward', (function(message) {
        this.onSessionMessage(message, session);
    }).bind(this));
    session.on('close', (function(message) {
        this.sessions.splice( this.sessions.indexOf( session ), 1 );
    }).bind(this));

    if (this.network && this.network.registered) {
        this.attach(session);
        this.applyNetworkStatus(session);
    }
    else {
        this.waitingSessions.push(session);
        this.connect();
    }
};

Bouncer.prototype.attach = function(session) {
    Log.info(this.tagForLog(), 'New client connection attached');
    session.send(session.nick, 'NICK', [ this.network.nick ] );
    session.nick = this.network.nick;
    session.notifyAttached();
    this.sessions.push(session);
};

Bouncer.prototype.applyNetworkStatus = function(session) {
    Log.info(this.tagForLog(), 'Sending network status to new client');
    this.initializeMessages.forEach( (function(message) {
        var params = [ this.network.nick ].concat( message.params.slice(1) );
        session.send( message.prefix, message.command, params );
    }).bind(this));
    for ( var channelName in this.network.channels ) {
        session.send( session.prefix, 'JOIN', [ channelName ]);
        // channelオブジェクトから RPL_NAMREPLY をおくるのがのぞましい
        this.network.send( 'NAMES', [ channelName ]);
    }
};

Bouncer.prototype.onNetworkRegister = function() {
    // force the connecting session nick
    this.waitingSessions.forEach( (function(session) {
        this.attach(session);
    }).bind(this) );
    this.waitingSessions = [];
};

Bouncer.prototype.onSessionMessage = function(message, session) {
    Log.info(this.tagForLog(), 'Sending message: ' + message.toRaw());
    if (this.network && this.network.registered) {
        this.network.send( message.command, message.params);
    }
    else {
        Log.debug(this.tagForLog(), 'Buffering message: ' + message.toRaw());
        this.connect();
    }
};

Bouncer.prototype.onNetworkMessage = function(message) {
    Log.info(this.tagForLog(), 'Received message: ' + message.toRaw());
    if ( message.command.match(/^(?:00[1-5]|25[0-5]|26[56]|37[256])$/) ) {
        this.initializeMessages.push( message );
    }

    this.sessions.forEach( (function(session) {
        session.send( message.prefix, message.command, message.params );
    }).bind(this) );
};

module.exports = Bouncer;
