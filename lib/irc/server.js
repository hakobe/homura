'use strict';

var net = require('net');
var util = require('util');
var events = require('events');
var Log = require('../util/log');
var Session = require('./session');

function Server(options) {
    this.host     = options.host || null;
    this.port     = options.port || '6667';

    this.sessions   = [];
    var SessionClass = options.session || Session;

    this.server = net.createServer( (function( connection ) {
        var session = new SessionClass( connection );
        this.sessions.push( session );
        this.emit('connect', session);
    }).bind(this) );

    events.EventEmitter.call(this);
};

util.inherits( Server, events.EventEmitter );

Server.prototype.start = function() {
    Log.info('<irc.Server> Starting IRC server on ' + (this.host || 'localhost') + ':' + this.port);
    this.server.listen( this.port, this.host, (function() {
        Log.debug('<irc.Server> Server has bound to ' + (this.host || 'localhost') + ':' + this.port);
    }).bind(this) );
};

module.exports = Server;
