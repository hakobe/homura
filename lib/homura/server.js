'use strict';

var util = require('util');
var irc = require('../irc');
var Log = require('../util/log');
var Bouncer = require('./bouncer');
var Session = require('./session');

function Server(options) {
    options.session = Session;
    irc.Server.call(this, options);

    this.bouncers = {};
}

util.inherits(Server, irc.Server);

Server.prototype.on('connect', function(session) {
    session.on('auth', ( function() {
        this.requestAttach(session);
    }).bind(this));
});

Server.prototype.requestAttach = function(session) {
    var found = this.bouncers[ session.bouncerName ];

    if (found) {
        found.requestAttach( session );
    }
    else {
        session.disconnect();
        // sessionの接続を切る
    }
};

Server.prototype.addBouncer = function(bouncer) {
    this.bouncers[ bouncer.name ] = bouncer;
};

module.exports = Server;
