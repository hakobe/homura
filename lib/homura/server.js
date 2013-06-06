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
    session.on('active', ( function() {
        this.attach(session);
    }).bind(this));
});

Server.prototype.attach = function(session) {
    var found = this.bouncers[ session.networkName ];

    if (found) {
        found.connect();
        found.attach( session );
    }
    else {
        // sessionの接続を切る
    }
};

Server.prototype.addBouncer = function(bouncer) {
    this.bouncers[ bouncer.networkName ] = bouncer;
};

module.exports = Server;
