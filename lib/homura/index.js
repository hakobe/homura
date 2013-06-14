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

    // pipe events
    this.server.on('sessionCreate', (function(bouncer, session) {
        pluginEventEmitter.emit('sessionCreate', bouncer, session);
    }).bind(this));

    this.options.networks.forEach( (function(networkOption) {
        var bouncer = new Bouncer( networkOption );
        // pipe events
        bouncer.on('networkCreate', (function(network) {
            pluginEventEmitter.emit('networkCreate', bouncer, network);
        }).bind(this));
        this.server.addBouncer( bouncer );
    }).bind(this) );

    Log.debug(this.tagForLog(), 'Loading plugins');
    var plugins = ( this.options.plugins || [] ).map( (function(pluginOption) {
        var plugin = require( '../../plugins/' + pluginOption.name );
        if (plugin.init) {
            Log.debug(this.tagForLog(), 'Loading plugin: ' + pluginOption.name);
            plugin.init( pluginOption );
        }
        return plugin;
    }).bind(this) );

    pluginEventEmitter.on( 'networkCreate', (function(bouncer, network) {
        plugins.forEach( (function(plugin) {
            if (plugin.handleNetwork) {
                Log.debug(this.tagForLog(), 'Setting network handlers for plugin : ' + plugin.options.name);
                plugin.handleNetwork( bouncer, network );
            }
        }).bind(this) );
    }).bind(this) );

    pluginEventEmitter.on( 'sessionCreate', (function(bouncer, session) {
        plugins.forEach( (function(plugin) {
            if (plugin.handleSession) {
                Log.debug(this.tagForLog(), 'Setting client handlers for plugin : ' + plugin.name);
                plugin.handleSession( bouncer, session );
            }
        }).bind(this) );
    }).bind(this) );

    this.server.start();
};

module.exports.Homura = Homura;
module.exports.Server = Server;
module.exports.Bouncer = Bouncer;
