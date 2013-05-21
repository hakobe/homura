var net = require('net');
var util = require('util');
var events = require('events');

var Log = require('../util/log');
var Message = require('./message');
var Isupport = require('./isupport');

function Client(options) {
    var self = this;

    self.server   = options.server;
    self.port     = options.port;
    self.nick     = options.nick;
    self.user     = options.user;
    self.real     = options.real;
    self.password = options.password;
    self.debug    = options.debug || false;

    self.isupport = new Isupport();
    self.channels = {};

    events.EventEmitter.call(this);

    if (self.debug) {
        Log.level = Log.DEBUG;
    }

    self.on('raw', function(message) {
        /*
        var meth = 'on_' + message.command.toLowerCase();
        meth = meth.replace(/_./g, function($0) {
            return $0[1].toUpperCase();
        });

        // default handler
        if (self[ meth ]) {
            Log.debug('Processing message: ' + message.toRaw());
            self[ meth ].call(self, message);
        }
        else {
            Log.debug('Unhandled message: ' + message.toRaw());
        }
        */

        self.emit( message.command.toLowerCase(), message );
    });
}

util.inherits(Client, events.EventEmitter);

Client.prototype.connect = function() {
    var self = this;

    self.connection = net.connect({
        host : self.server,
        port : self.port,
    }, function() {
        Log.debug('connect!!');
        if (self.password) {
            self.send('PASS', self.password);
        }
        self.send('NICK', self.nick);
        self.send('USER', self.user, '0', '*', self.real);
    });
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
};

Client.prototype.send = function() {
    var args = Array.prototype.slice.call(arguments);
    var command = args.shift();
    var params  = args;

    var message = new Message( null, command, params );
    Log.debug("Sending message: " + message.toRaw());
    this.connection.write( message.toRaw() );
};

Client.prototype.on('ping', function(message) {
    this.send( 'PONG', message.params[0] );
});

Client.prototype.on('rpl_isupport', function(message) {
    this.isupport.update( message.params.slice(1, -2) );
});

// for channel handling

Client.prototype.on('rpl_namreply', function(message) {
    console.dir(message);
    var self = this;
    var type = message.params[1];
    var channelName = message.params[2];
    var users = message.params[3];

    if (!self.channels[channelName]) {
        self.channels[channelName] = { // Channel Object?
            users : {},
            mode  : {}
        };
    }

    switch(type) {
        case '@':
            self.channels[channelName].mode['s'] = true;
            break;
        case '*':
            self.channels[channelName].mode['p'] = true;
            break;
        case '=':
            // public
            break;
        default:
            // nop
    }

    var prefixes = '';
    var prefixToMode = {};
    for ( var mode in self.isupport.config.PREFIX ) {
        var prefix = self.isupport.config.PREFIX[ mode ];
        prefixToMode[ prefix ] = mode;
        prefixes += prefix;
    }
    users.split(' ').forEach(function(user) {
        var m = user.match( '^([' + prefixes + ']*)(.*)' );
        var nick  = m[2];
        if (!self.channels[channelName].users[nick]) {
            self.channels[channelName].users[nick] = { // User Object?
                mode : {}
            };
        }
        m[1].split('').forEach( function(c) {
            self.channels[channelName].users[nick].mode[prefixToMode[c]] = true
        } )
    });
});

module.exports = Client;
