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
        var Module = require( '../../modules/' + moduleOption.name );
        var module = new Module( moduleOption );
        return module;
    }).bind(this) );

    // pipe events
    this.server.on('sessionCreate', (function(session, bouncer) {
        moduleEventEmitter.emit('sessionCreate', session, bouncer);
    }).bind(this));

    this.options.networks.forEach( (function(networkOption) {
        var bouncer = new Bouncer( networkOption );
        // pipe events
        bouncer.on('networkCreate', (function(network) {
            moduleEventEmitter.emit('networkCreate', network, bouncer);
        }).bind(this));
        this.server.addBouncer( bouncer );

        modules.forEach( (function(module) {
            if (module.handleBouncer) {
                Log.debug(this.tagForLog(), 'Setting bouncer handlers for module : ' + module.name);
                module.handleBouncer( bouncer );
            }
        }).bind(this) );
    }).bind(this) );

    moduleEventEmitter.on( 'networkCreate', (function(network, bouncer) {
        modules.forEach( (function(module) {
            if (module.handleNetwork) {
                Log.debug(this.tagForLog(), 'Setting network handlers for module : ' + module.name);
                module.handleNetwork( network, bouncer );
            }
        }).bind(this) );
    }).bind(this) );

    moduleEventEmitter.on( 'sessionCreate', (function(session, bouncer) {
        modules.forEach( (function(module) {
            if (module.handleSession) {
                Log.debug(this.tagForLog(), 'Setting session handlers for module : ' + module.name);
                module.handleSession( session, bouncer );
            }
        }).bind(this) );
    }).bind(this) );

    this.server.start();
};

module.exports.Homura = Homura;
module.exports.Server = Server;
module.exports.Bouncer = Bouncer;
