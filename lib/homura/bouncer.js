'use strict';

var util = require('util');
var events = require('events');
var irc = require('../irc');
var Log = require('../util/log');
var Client = require('./client');

function Bouncer(options) {
    this.ircClient = null;
    this.name = options.name || '__NONAME__';
    this.ircClientOptions = {
        host     : options.host,
        port     : options.port,
        nick     : options.nick,
        user     : options.user,
        real     : options.real,
        encoding : options.encoding,
        password : options.password,
        tls      : options.tls,
    };
    this.ircClientRetryCount = 3;
    this.ircClientRetryDelay = 2000;

    this.userSessions = [];
    this.waitingUserSessions = [];

    this.initializeMessages = [];

    events.EventEmitter.call(this);
}

util.inherits( Bouncer, events.EventEmitter );

Bouncer.prototype.tagForLog = function() {
    return 'homura.Bouncer' + '(' + this.name + ')';
};

Bouncer.prototype.connect = function() {
    if (!this.ircClient) {
        this.ircClient = new Client( this.ircClientOptions );
        this.ircClient.on('forward', (function(message) {
            this.onIrcClientMessage(message);
        }).bind(this));
        this.ircClient.on('connect', (function(message) {
            this.ircClientRetryCount = 3;
        }).bind(this));
        this.ircClient.on('register', (function(message) {
            this.onIrcClientRegister();
        }).bind(this));
        this.ircClient.on('close', (function(message) {
            this.ircClient = null;
            setTimeout( (function() {
                if ( this.ircClientRetryCount > 0 ) {
                    Log.info(this.tagForLog(), 'Try reconnecting');
                    this.ircClientRetryCount -= 1;
                    this.connect()
                }
            }).bind(this), this.ircClientRetryDelay);
            this.initializeMessages = [];
        }).bind(this));
        this.ircClient.connect();

        this.emit('ircClientCreated', this.ircClient);
    }
};

Bouncer.prototype.isAttached = function() {
    return this.userSessions.length > 0;
};

Bouncer.prototype.tryAttach = function(userSession) {

    userSession.on('forward', (function(message) {
        this.onUserSessionMessage(message, userSession);
    }).bind(this));
    userSession.on('close', (function(message) {
        var index = this.userSessions.indexOf( userSession );
        if (index !== -1) {
            this.userSessions.splice( index, 1 );
        }
        Log.info(this.tagForLog(), 
                "There are " + this.userSessions.length + " sessions connecting :  " +
                this.userSessions.map( function(s) { return s.prefix + ':' + (s.active ? 'active' : 'deactive') } ).join(', '));
    }).bind(this));

    this.emit('userSessionCreated', userSession);

    if (this.ircClient && this.ircClient.registered) {
        this.attach(userSession);
        this.sync(userSession);
    }
    else {
        this.waitingUserSessions.push(userSession);
        this.connect();
    }
};

Bouncer.prototype.attach = function(userSession) {
    Log.info(this.tagForLog(), 'New client connection attached');
    userSession.send(userSession.nick, 'NICK', [ this.ircClient.nick ] );
    userSession.nick = this.ircClient.nick;
    userSession.notifyAttached();
    this.userSessions.push(userSession);

    Log.info(this.tagForLog(), 
            "There are " + this.userSessions.length + " sessions connecting :  " +
            this.userSessions.map( function(s) { return s.prefix + ':' + (s.active ? 'active' : 'deactive') } ).join(', '));
};

Bouncer.prototype.sync = function(userSession) {
    Log.info(this.tagForLog(), 'Sending irc client status to new user session');
    this.initializeMessages.forEach( (function(message) {
        var params = [ this.ircClient.nick ].concat( message.params.slice(1) );
        userSession.send( message.prefix, message.command, params );
    }).bind(this));
    for ( var channelName in this.ircClient.channels ) {
        var channel = this.ircClient.channels[ channelName ];

        userSession.send( userSession.prefix, 'JOIN', [ channelName ]);

        var prefixedUsernames = [];
        for ( var userName in channel.users ) {
            var user = channel.users[ userName ];
            prefixedUsernames.push( Object.keys( user.mode ).map( (function(m) {
                return this.ircClient.isupport.config.PREFIX[ m ] || '';
            }).bind(this)).join('') + user.nick );
        }
        userSession.send( userSession.serverName, '353', [
            this.ircClient.nick,
            channel.mode['s'] ? '@' : channel.mode['p'] ? '*' : '=',
            channelName,
            prefixedUsernames.join(' '),
        ]);
        userSession.send( userSession.serverName, '366', [
            this.ircClient.nick,
            channelName,
            'End of /NAMES list.',
        ]);

        if (channel.topic) {
            userSession.send( userSession.serverName, '332', [
                this.ircClient.nick,
                channelName,
                channel.topic.content,
            ]);
            userSession.send( userSession.serverName, '333', [
                this.ircClient.nick,
                channelName,
                channel.topic.who,
                channel.topic.time,
            ]);
        }
    }
    this.emit('sync', userSession);
};

Bouncer.prototype.onIrcClientRegister = function() {
    // force the connecting client nick
    this.waitingUserSessions.forEach( (function(userSession) {
        if (!userSession.active) {
            return;
        }
        this.attach(userSession);
    }).bind(this) );
    this.waitingUserSessions = [];
};

Bouncer.prototype.onUserSessionMessage = function(message, userSession) {
    Log.info(this.tagForLog(), 'Sending message: ' + message.toRaw());
    if (this.ircClient && this.ircClient.registered) {
        this.ircClient.send( message.command, message.params);
    }
    else {
        Log.debug(this.tagForLog(), 'Buffering message: ' + message.toRaw());
        this.connect();
    }
};

Bouncer.prototype.onIrcClientMessage = function(message) {
    Log.info(this.tagForLog(), 'Received message: ' + message.toRaw());
    if ( message.command.match(/^(?:00[1-5]|25[0-5]|26[56]|37[256])$/) ) {
        this.initializeMessages.push( message );
    }

    this.userSessions.forEach( (function(userSession) {
        userSession.send( message.prefix, message.command, message.params );
    }).bind(this) );
};

module.exports = Bouncer;
