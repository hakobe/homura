'use strict';

var net = require('net');
var util = require('util');
var events = require('events');

var Message = require('./message');

function Client(options) {
    var self = this;

    self.server   = options.server;
    self.port     = options.port;
    self.nick     = options.nick;
    self.user     = options.user;
    self.password = options.password;
    self.debug    = options.debug || false;

    events.EventEmitter.call(this);

    self.on('raw', function(message) {
        var meth = 'on' + message.command.toLowerCase().
            replace(/^\w/, function($0) {
                return $0.toUpperCase();
            });
        if (self[ meth ]) {
            if (self.debug) {
                util.log('Processing message: ' + message.raw);
            }
            self[ meth ].call(self, message);
        }
        else {
            if (self.debug) {
                util.log('Unhandled message: ' + message.raw);
            }
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
        if (self.debug) {
            util.log('connect!!');
        }
        if (self.password) {
            self.send('PASS ' + self.password);
        }
        self.send('NICK ' + self.nick);
        self.send('USER ' + self.user);
    });
    self.connection.setEncoding('utf8');
    self.connection.setTimeout(0);

    var buffer = '';
    self.connection.on('data', function(data) {
        buffer += data;
        var lines = buffer.split("\r\n");
        buffer = lines.pop();

        lines.forEach( function(line) {
            self.emit( 'raw', new Message( line ) )
        });
    });
    self.connection.on('end', function() {
        console.log('client disconnected');
    });
};

Client.prototype.send = function(message) {
    if (this.debug) {
        util.log("Sending message:" + message);
    }
    this.connection.write( message + "\r\n" );
};

Client.prototype.onPing = function(message) {
    console.log( message );
    this.send( 'PONG ' + message.params[0] );
    this.emit( 'ping',  message.params[0] );
};

Client.prototype.onNotice = function(message) {
    var from = message.user;
    var to   = message.params[0];
    var text = message.params[1];
    this.emit( 'notice', from, to, text );
};

Client.prototype.onPrivmsg = function(message) {
    var from = message.user;
    var to   = message.params[0];
    var text = message.params[1];
    this.emit( 'privmsg', from, to, text );
};

module.exports = Client;
