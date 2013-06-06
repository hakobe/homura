var util = require('util');
var events = require('events');
var Message = require('./message');
var Log = require('../util/log');
var NumericReply = require('./numeric_reply.js');

function Session(connection) {
    this.connection = connection;

    this.prefix = '';
    this.nick = '';
    this.user = '';
    this.real = '';
    this.host = '';

    this.serverName = 'homura-lib';
    this.version = '0.0.1';
    this.created = new Date();
    this.userModes = 'osi';
    this.channelModes = 'osnik';

    events.EventEmitter.call(this);

    this.connection.setEncoding('utf8');
    this.connection.setTimeout(0);

    var buffer = '';
    this.connection.on('data', (function(data) {
        buffer += data;
        var lines = buffer.split("\r\n");
        buffer = lines.pop();

        lines.forEach( (function(line) {
            this.emit( 'raw', Message.parse( line ) )
        }).bind(this));
    }).bind(this));
    this.connection.on('end', function() {
    });

    this.on('raw', (function(message) {
        Log.debug('<irc.Session> received raw message: ' + message.toRaw());
        var meth = 'on_' + message.command.toLowerCase();
        meth = meth.replace(/_./g, function($0) {
            return $0[1].toUpperCase();
        });
        if ( this[ meth ] ) {
            this[ meth ].call(this, message);
        }
        this.emit( message.command.toLowerCase(), message);
    }).bind(this));
};

util.inherits(Session, events.EventEmitter);

Session.prototype.send = function(prefix, command, params) {
    var message = new Message( prefix, command, params );
    Log.debug("<irc.Session> Sending message: " + message.toRaw());
    this.connection.write( message.toRaw() );
};

Session.prototype.onNick = function(message) {
    this.nick = message.params[0];
    if (this.prefix) {
        this.prefix = this.nick + '!' + this.user + '@' + this.host;
    }
};

Session.prototype.onUser = function(message) {
    this.user = message.params[0];
    this.real = message.params[3];
    if (!this.nick) {
        this.nick = this.user;
    }
    this.host = this.connection.remoteAddress;
    this.prefix = this.nick + '!' + this.user + '@' + this.host;
    this.welcome();
};

Session.prototype.welcome = function() {
    this.send(this.serverName, NumericReply.numFor('RPL_WELCOME'),  [ this.nick, "Welcome to Internet Relay Network " + this.prefix ]);
    this.send(this.serverName, NumericReply.numFor('RPL_YOURHOST'), [ this.nick, "Your host is " + this.serverName + ", running version " + this.version ]);
    this.send(this.serverName, NumericReply.numFor('RPL_CREATED'),  [ this.nick, "This server was created " + this.created.toString() ]);
    this.send(this.serverName, NumericReply.numFor('RPL_MYINFO'),   [ this.nick, [ this.serverName, this.version, this.userModes, this.channelModes].join(' ') ]);
};

module.exports = Session;
