var net = require('net');
var util = require('util');
var events = require('events');

var Log = require('../log');
var Message = require('./message');

function Client(options) {
    var self = this;

    self.server   = options.server;
    self.port     = options.port;
    self.nick     = options.nick;
    self.user     = options.user;
    self.real     = options.real;
    self.password = options.password;
    self.debug    = options.debug || false;

    events.EventEmitter.call(this);

    if (self.debug) {
        Log.level = Log.DEBUG;
    }

    self.on('raw', function(message) {
        var meth = 'on_' + message.command;
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

Client.prototype.onPing = function(message) {
    this.send( 'PONG', message.params[0] );
};

module.exports = Client;
