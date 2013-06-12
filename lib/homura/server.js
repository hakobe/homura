'use strict';

var util = require('util');
var irc = require('../irc');
var Log = require('../util/log');
var Bouncer = require('./bouncer');
var Session = require('./session');

function Server(options) {
    options.session = Session;
    irc.Server.call(this, options);

    this.password = options.password;

    this.bouncers = {};
}

util.inherits(Server, irc.Server);

Server.prototype.tagForLog = function() {
    return 'homura.Server' + '(' + this.host + ':' + this.port + ')';
};

Server.prototype.on('connect', function(session) {
    session.on('requestauth', ( function() {
        if ( this.password && session.password !== this.password ) {
            Log.error(this.tagForLog(), "Password incorrect");
            session.send(session.serverName, '464', [ 'Password required' ]);
            session.disconnect();
        }
        else {
            Log.info(this.tagForLog(), "Connection authorized by password");
            this.requestAttach(session);
        }
    }).bind(this));
});

Server.prototype.requestAttach = function(session) {
    var found = this.bouncers[ session.bouncerName ];

    if (found) {
        found.requestAttach( session );
    }
    else {
        Log.error(this.tagForLog(), "Attach failed. Can not find network named \"" + session.bouncer + "\" for \"" + session.prefix + "\"");
        session.disconnect();
    }
};

Server.prototype.addBouncer = function(bouncer) {
    this.bouncers[ bouncer.name ] = bouncer;
};

module.exports = Server;
