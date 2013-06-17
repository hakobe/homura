'use strict';

var net = require('net');
var tls = require('tls');
var fs = require('fs');
var util = require('util');
var events = require('events');
var Log = require('../util/log');
var Session = require('./session');

function Server(options) {
    this.host     = options.host || null;
    this.port     = options.port || '6667';

    this.sessions   = [];
    var SessionClass = options.session || Session;

    function onConnect( connection ) {
        Log.info(this.tagForLog(), 'New client has been connected from ' + connection.remoteAddress);

        var session = new SessionClass( connection );
        this.sessions.push( session );
        this.emit('connect', session);
    }

    if (options.tls) {
        ['pfx', 'ca', 'key', 'cert'].forEach( (function(keybase) {
            var key = keybase + '_file';
            if ( options.tls[ key ]) {
                options.tls[ keybase ] = fs.readFileSync( options.tls[ key ] );
                delete options.tls[ key ];
            }
        }).bind(this) );
        this.server = tls.createServer(
            options.tls,
            (function( cleartextStream ) {
                if (cleartextStream.authorized) {
                    Log.info(this.tagForLog(), 'TLS onnection has been authorized');
                }
                else {
                    Log.info(this.tagForLog(), 'TLS connection has NOT been authorized : ' + cleartextStream.authorizationError);
                }
                onConnect.call(this, cleartextStream);
            }).bind(this)
        );
    }
    else {
        this.server = net.createServer( (function( connection ) {
            onConnect.call(this, connection);
        }).bind(this) );
    }

    events.EventEmitter.call(this);
};

util.inherits( Server, events.EventEmitter );

Server.prototype.tagForLog = function() {
    return 'irc.Server' + '(' + this.host + ':' + this.port + ')';
};

Server.prototype.start = function() {
    Log.debug(this.tagForLog(), 'Starting IRC server on ' + (this.host || '*') + ':' + this.port);
    this.server.listen( this.port, this.host, (function() {
    }).bind(this) );
};

module.exports = Server;
