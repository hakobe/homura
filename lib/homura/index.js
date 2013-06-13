'use strict';

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

    this.options.networks.forEach( (function(networkOption) {
        this.server.addBouncer( new Bouncer( networkOption ) );
    }).bind(this) );

    Log.debug(this.tagForLog(), 'Loading plugins');
    var plugins = ( this.options.plugins || [] ).map( function(pluginOption) {
        var plugin = require( '../../plugins/',  pluginOption.name );
        if (plugin.init) {
            plugin.init( this, pluginOption );
        }
        return plugin;
    });

    this.server.on('networkCreate', function(bouncer) {
        plugins.forEach( (function(plugin) {
            if (plugin.handleNetwork) {
                Log.debug(this.tagForLog(), 'Setting network handlers for plugin : ' + plugin.name);
                plugin.handleNetwork( bouncer );
            }
        }).bind(this) );
    });

    this.server.on('clientAttach', function(bouncer, session) {
        plugins.forEach( (function(plugin) {
            if (plugin.handleClient) {
                Log.debug(this.tagForLog(), 'Setting client handlers for plugin : ' + plugin.name);
                plugin.handleClient( bouncer, session );
            }
        }).bind(this) );
    });

    this.server.start();
};

module.exports.Homura = Homura;
module.exports.Server = Server;
module.exports.Bouncer = Bouncer;
