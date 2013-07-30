'use strict';

var events = require('events');

var Server = require('./server');
var Bouncer = require('./bouncer');

var Log = require('../util/log');

function Homura(options) {
    this.options = options;
    this.server = null;
}

Homura.prototype.tagForLog = function() {
    return 'homura.Homura';
};

Homura.prototype.start = function() {
    Log.info(this.tagForLog(), 'Starting homura IRC bouncer');

    this.server = new Server(this.options);

    var moduleEventEmitter = new events.EventEmitter();

    Log.debug(this.tagForLog(), 'Loading modules');
    var modules = ( this.options.modules || [] ).map( (function(moduleOption) {
        Log.debug(this.tagForLog(), 'Loading module: ' + moduleOption.name);
        var Module = require( (moduleOption.name.match(/^homura-/) ? '' : '../../modules/')  + moduleOption.name );
        var module = new Module( moduleOption );
        return module;
    }).bind(this) );

    // pipe events

    this.options.bouncers.forEach( (function(bouncerOption) {
        var bouncer = new Bouncer( bouncerOption );
        // pipe events
        bouncer.on('ircClientCreated', (function(ircClient) {
            moduleEventEmitter.emit('ircClientCreated', ircClient, bouncer);
        }).bind(this));
        this.server.addBouncer( bouncer );

        bouncer.on('userSessionCreated', (function(userSession) {
            moduleEventEmitter.emit('userSessionCreated', userSession, bouncer);
        }).bind(this));

        modules.forEach( (function(module) {
            if (module.handleBouncer) {
                Log.debug(this.tagForLog(), 'Setting bouncer handlers for module : ' + module.name);
                module.handleBouncer( bouncer );
            }
        }).bind(this) );
    }).bind(this) );

    moduleEventEmitter.on( 'ircClientCreated', (function(ircClient, bouncer) {
        modules.forEach( (function(module) {
            if (module.handleIrcClient) {
                Log.debug(this.tagForLog(), 'Setting handlers of irc client to server for module : ' + module.name);
                module.handleIrcClient( ircClient, bouncer );
            }
        }).bind(this) );
    }).bind(this) );

    moduleEventEmitter.on( 'userSessionCreated', (function(userSession, bouncer) {
        modules.forEach( (function(module) {
            if (module.handleUserSession) {
                Log.debug(this.tagForLog(), 'Setting session handlers for module : ' + module.name);
                module.handleUserSession( userSession, bouncer );
            }
        }).bind(this) );
    }).bind(this) );

    this.server.start();
};

module.exports.Homura = Homura;
module.exports.Server = Server;
module.exports.Bouncer = Bouncer;
