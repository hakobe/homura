'use strict'; 

var util = require('util');
var events = require('events');
var Message = require('./message');
var Log = require('../util/log');

function Session(connection) {
    this.connection = connection;

    this.nick = '';
    this.user = '';
    this.real = '';
    this.host = '';
    this.password = '';

    this.serverName = 'homura-lib';
    this.version = '0.0.1';
    this.created = new Date();
    this.userModes = 'osi';
    this.channelModes = 'osnik';

    events.EventEmitter.call(this);

    this.connection.setTimeout(0);

    var buffer = '';
    this.connection.on('data', (function(data) {
        buffer += data;
        var lines = buffer.split("\r\n");
        buffer = lines.pop();

        lines.forEach( (function(line) {
            this.onRaw( line );
        }).bind(this));
    }).bind(this));
    this.connection.on('end', (function() {
        Log.debug(this.tagForLog(), "Connection end");
    }).bind(this));
    this.connection.on('close', (function() {
        Log.info(this.tagForLog(), "Connection closed");
        this.emit('close');
    }).bind(this));
    this.connection.on('error', (function(error) {
        Log.debug(this.tagForLog(), "Network error: " + error);
    }).bind(this));

    this.on('raw', (function(message) {
    }).bind(this));
    this.on('error', function() { });
};

util.inherits(Session, events.EventEmitter);

Session.prototype.tagForLog = function() {
    return 'irc.Session' + ( this.prefix ? '(' + this.prefix + ')' : '' );
};

Object.defineProperty( Session.prototype, 'prefix', {
    get : function() { 
        if ( this.nick && this.user && this.host ) {
            return this.nick + '!' + this.user + '@' + this.host;
        }
        else {
            return '';
        }
    },
});

Session.prototype.send = function(prefix, command, params) {
    var message = new Message( prefix, command, params );
    Log.debug(this.tagForLog(), "Sending message: " + message.toRaw());
    this.connection.write( message.toRaw() );
    this.emit( 'sendMessage', message );
};

Session.prototype.disconnect = function() {
    Log.info(this.tagForLog(), "Closing connection");
    this.connection.end();
};

Session.prototype.onRaw = function(raw) {
    var message = Message.parse( raw );

    Log.debug(this.tagForLog(), 'Received message: ' + message.toRaw());
    var meth = 'on_' + message.command.toLowerCase();
    meth = meth.replace(/_./g, function($0) {
        return $0[1].toUpperCase();
    });
    if ( this[ meth ] ) {
        this[ meth ].call(this, message);                // default overridable handler for specific command
    }
    this.onMessage(message);                             // overridable handler to capture all message

    this.emit( message.command.toLowerCase(), message ); // event for specifc command message
};

Session.prototype.onMessage = function(message) {
    // should be overridden to capture all message
}

Session.prototype.onPass = function(message) {
    this.password = message.params[0];
};

Session.prototype.onNick = function(message) {
    this.nick = message.params[0];
};

Session.prototype.onUser = function(message) {
    this.user = message.params[0];
    this.real = message.params[3];
    if (!this.nick) {
        this.nick = this.user;
    }
    this.host = this.connection.remoteAddress;
    this.welcome();
};

Session.prototype.onQuit = function(message) {
    this.disconnect();
}

Session.prototype.welcome = function() {
    this.send(this.serverName, '001', [ this.nick, "Welcome to Internet Relay Network " + this.prefix ]);
    this.send(this.serverName, '002', [ this.nick, "Your host is " + this.serverName + ", running version " + this.version ]);
    this.send(this.serverName, '003', [ this.nick, "This server was created " + this.created.toString() ]);
    this.send(this.serverName, '004', [ this.nick, [ this.serverName, this.version, this.userModes, this.channelModes].join(' ') ]);
};

module.exports = Session;
