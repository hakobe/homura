'use strict';

var nopt = require("nopt");
var path = require("path");
var fs = require("fs");

var Server = require('./server');
var Bouncer = require('./bouncer');
var Log = require('../util/log');
Log.level = Log.ERROR;

var Cli = Object.create({
    run : function(argv) {
        var options = nopt( {
            config  : path,
            help    : Boolean,
            debug   : Boolean,
            verbose : Boolean,
        }, {
            v : '--verbose',
        }, argv, 2 );

        if (options.verbose) {
            Log.level = Log.INFO;
        }

        if (options.debug) {
            Log.level = Log.DEBUG;
        }

        if (options.help) {
            this.help();
            prototype.exit(0);
        }

        if (!options.config) {
            options.config = path.resolve(process.cwd(), './config.json');
        }

        var config;
        try {
            var configJson = fs.readFileSync( options.config, { encoding: 'utf8' } );
            config = JSON.parse( configJson );
        }
        catch(err) {
            console.error("Error: Can not read config file \"" + options.config + "\"\n\n" + err);
            process.exit(1);
        }

        var networkOptions = config.networks;
        delete config.networks;

        var server = new Server(config);
        networkOptions.forEach( function(networkOption) {
            server.addBouncer( new Bouncer( networkOption ) );
        } );

        server.start();
    },
    help : function() {
        console.log('Usage: ...');
    }
});

module.exports = Cli;
