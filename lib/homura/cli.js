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
            version : Boolean,
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
            process.exit(0);
        }

        if (options.version) {
            this.version();
            process.exit(0);
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
        var helpDocPath = path.resolve(__dirname, '../../doc/cli/help.txt');
        var helpText = fs.readFileSync( helpDocPath, { encoding: 'utf8' });
        console.log(helpText);
    },
    version: function() {
        var packageJsonPath = path.resolve(__dirname, '../../package.json');
        var packageJson = fs.readFileSync( packageJsonPath, { encoding: 'utf8' });
        var packageInfo = JSON.parse( packageJson );
        console.log( packageInfo.version );
    },
});

module.exports = Cli;
