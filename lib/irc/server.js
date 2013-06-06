var net = require('net');
var util = require('util');
var events = require('events');
var Log = require('../util/log');
var Session = require('./session');

function Server(options) {
    var self = this;
    self.host       = options.host || null;
    self.port       = options.port || '6667';
    self.sessions   = [];
    var SessionClass = options.session || Session;

    self.server = net.createServer(function( connection ) {
        var session = new SessionClass( connection );
        self.sessions.push( session );
        self.emit('connect', session);
    });

    events.EventEmitter.call(self);
};

util.inherits( Server, events.EventEmitter );

Server.prototype.start = function() {
    var self = this;
    Log.info('<irc.Server> Starting IRC server on ' + (self.host || 'localhost') + ':' + self.port);
    self.server.listen( self.port, self.host, function() {
        Log.debug('<irc.Server> Server has bound to ' + (self.host || 'localhost') + ':' + self.port);
    });
};

module.exports = Server;
