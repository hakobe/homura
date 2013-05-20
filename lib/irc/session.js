var util = require('util');
var events = require('events');
var Message = require('./message');
var Log = require('../log');
var NumericReply = require('./numeric_reply.js');

function Session(connection) {
    var self = this;
    self.connection = connection;

    self.prefix = '';
    self.nick = '';
    self.user = '';
    self.real = '';
    self.host = '';

    self.serverName = 'homura-chan';
    self.version = '0.0.1';
    self.created = new Date();
    self.userModes = 'osi';
    self.channelModes = 'osnik';

    events.EventEmitter.call(this);

    self.connection.setEncoding('utf8');
    self.connection.setTimeout(0);

    var buffer = '';
    self.connection.on('data', function(data) {
        buffer += data;
        var lines = buffer.split("\r\n");
        buffer = lines.pop();

        lines.forEach( function(line) {
            self.emit( 'raw', Message.parse( line ) )
        });
    });
    self.connection.on('end', function() {
    });

    self.on('raw', function(message) {
        var meth = 'on_' + message.command.toLowerCase();
        meth = meth.replace(/_./g, function($0) {
            return $0[1].toUpperCase();
        });

        if (self[ meth ]) {
            Log.debug('Processing message: ' + message.toRaw());
            self[ meth ].call(self, message);
        }
        else {
            Log.debug('Unhandled message: ' + message.toRaw());
        }
    });
};

util.inherits(Session, events.EventEmitter);

Session.prototype.send = function() {
    var args = Array.prototype.slice.call(arguments);
    var prefix  = args.shift();
    var command = args.shift();
    var params  = args;

    var message = new Message( prefix, command, params );
    Log.debug("Sending message: " + message.toRaw());
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
    this.send(this.serverName, NumericReply.numFor('RPL_WELCOME'),  this.nick, "Welcome to Internet Relay Network " + this.prefix);
    this.send(this.serverName, NumericReply.numFor('RPL_YOURHOST'), this.nick, "Your host is " + this.serverName + ", running version " + this.version);
    this.send(this.serverName, NumericReply.numFor('RPL_CREATED'),  this.nick, "This server was created " + this.created.toString());
    this.send(this.serverName, NumericReply.numFor('RPL_MYINFO'),   this.nick, [ this.serverName, this.version, this.userModes, this.channelModes].join(' '));
};

module.exports = Session;
