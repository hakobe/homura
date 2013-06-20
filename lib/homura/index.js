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

    var pluginEventEmitter = new events.EventEmitter();

    Log.debug(this.tagForLog(), 'Loading plugins');
    var plugins = ( this.options.plugins || [] ).map( (function(pluginOption) {
        Log.debug(this.tagForLog(), 'Loading plugin: ' + pluginOption.name);
        var Plugin = require( '../../plugins/' + pluginOption.name );
        var plugin = new Plugin( pluginOption );
        return plugin;
    }).bind(this) );

    // pipe events
    this.server.on('sessionCreate', (function(session, bouncer) {
        pluginEventEmitter.emit('sessionCreate', session, bouncer);
    }).bind(this));

    this.options.networks.forEach( (function(networkOption) {
        var bouncer = new Bouncer( networkOption );
        // pipe events
        bouncer.on('networkCreate', (function(network) {
            pluginEventEmitter.emit('networkCreate', network, bouncer);
        }).bind(this));
        this.server.addBouncer( bouncer );

        plugins.forEach( (function(plugin) {
            if (plugin.handleBouncer) {
                Log.debug(this.tagForLog(), 'Setting bouncer handlers for plugin : ' + plugin.name);
                plugin.handleBouncer( bouncer );
            }
        }).bind(this) );
    }).bind(this) );

    pluginEventEmitter.on( 'networkCreate', (function(network, bouncer) {
        plugins.forEach( (function(plugin) {
            if (plugin.handleNetwork) {
                Log.debug(this.tagForLog(), 'Setting network handlers for plugin : ' + plugin.name);
                plugin.handleNetwork( network, bouncer );
            }
        }).bind(this) );
    }).bind(this) );

    pluginEventEmitter.on( 'sessionCreate', (function(session, bouncer) {
        plugins.forEach( (function(plugin) {
            if (plugin.handleSession) {
                Log.debug(this.tagForLog(), 'Setting session handlers for plugin : ' + plugin.name);
                plugin.handleSession( session, bouncer );
            }
        }).bind(this) );
    }).bind(this) );

    this.server.start();
};

module.exports.Homura = Homura;
module.exports.Server = Server;
module.exports.Bouncer = Bouncer;
