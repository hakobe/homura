'use strict';

var Server = require('./server');
var Bouncer = require('./bouncer');
var Log = require('../util/log');

function Homura(options) {
    var networkOptions = options.networks;
    delete options.networks;

    this.server = new Server(options);
    networkOptions.forEach( (function(networkOption) {
        this.server.addBouncer( new Bouncer( networkOption ) );
    }).bind(this) );
}

Homura.prototype.tagForLog = function() {
    return 'Homura';
};

Homura.prototype.start = function() {
    Log.info( this.tagForLog(), 'Starting homura..');
    this.server.start();
};

module.exports = Homura;
