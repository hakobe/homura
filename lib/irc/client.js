'use strict';

var net = require('net');
var tls = require('tls');
var fs = require('fs');
var util = require('util');
var events = require('events');

var Log = require('../util/log');
var Message = require('./message');
var Isupport = require('./isupport');
var Channel = require('./channel');
var User = require('./user');
var ModeParser = require('./mode_parser');

function Client(options) {
    this.server   = options.server;
    this.port     = options.port;
    this.nick     = options.nick;
    this.user     = options.user;
    this.real     = options.real;
    this.password = options.password;
    this.tls      = options.tls;

    this.mode     = {};
    this.isupport = new Isupport();
    this.channels = {};
    this.users    = {};

    this.encoding = options.encoding;

    events.EventEmitter.call(this);

    this.on('raw', (function(message) {
        Log.debug(this.tagForLog(), 'Received message: ' + message.toRaw());
        var meth = 'on_' + message.command.toLowerCase();
        meth = meth.replace(/_./g, function($0) {
            return $0[1].toUpperCase();
        });
        if ( this[ meth ] ) {
            this[ meth ].call(this, message);
        }
        this.emit( message.command.toLowerCase(), message );
    }).bind(this));
    this.on('error', function() { });
}

util.inherits(Client, events.EventEmitter);

Client.prototype.tagForLog = function() {
    return 'irc.Client' + '(' + this.nick + '!' + this.user + '@' + this.server + ')';
};

Client.prototype.connect = function() {
    Log.info(this.tagForLog(), 'Starting connection');

    function onConnect() {
        Log.info(this.tagForLog(), 'Connection is established');
        if (this.password) {
            this.send('PASS', [ this.password ]);
        }
        this.send('NICK', [ this.nick ]);
        this.send('USER', [ this.user, '0', '*', this.real ]);
        this.emit('connect');
    }

    if (this.tls) {
        ['pfx', 'ca', 'key', 'cert'].forEach( (function(keybase) {
            var key = keybase + '_file';
            if ( this.tls[ key ]) {
                this.tls[ keybase ] = fs.readFileSync( this.tls[ key ] );
                delete this.tls[ key ];
            }
        }).bind(this) );
        var selfSigned = delete this.tls.selfSigned;
        this.connection = tls.connect(
            this.port,
            this.server,
            this.tls,
            (function() {
                if ( 
                    this.connection.authorized ||
                    ( selfSigned && this.connection.authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT' )
                ) {
                    Log.info(this.tagForLog(), 'TLS onnection has been authorized');
                    onConnect.call(this);
                }
                else {
                    Log.info(this.tagForLog(), 'TLS onnection has been authorized');
                    this.connection.end();
                }
            }).bind(this)
        );
    }
    else {
        this.connection = net.connect(
            this.port,
            this.server,
            (function() {
                onConnect.call(this);
            }).bind(this)
        );
    }

    this.connection.setTimeout(0);

    var buffer = '';
    this.connection.on('data', (function(data) {
        buffer += data;
        var lines = buffer.split("\r\n");
        buffer = lines.pop();

        lines.forEach( (function(line) {
            this.emit( 'raw', Message.parse( line, this.encoding ) )
        }).bind(this) );
    }).bind(this));
    this.connection.on('end', (function() {
        Log.debug(this.tagForLog(), "Connection end");
    }).bind(this));
    this.connection.on('close', (function() {
        Log.info(this.tagForLog(), "Connection closed");
        this.emit('close');
    }).bind(this));
    this.connection.on('error', function(error) {
        Log.debug(this.tagForLog(), "Network error: " + error);
    });
};

Client.prototype.send = function(command, params) {
    var message = new Message( null, command, params );
    Log.debug(this.tagForLog(), "Sending message: " + message.toRaw());
    this.connection.write( message.toRaw(this.encoding) );
};

Client.prototype.onError = function(message) {
};

Client.prototype.onPing = function(message) {
    this.send( 'PONG', [ message.params[0] ] );
};

Client.prototype.on005 = function(message) {
    this.isupport.update( message.params.slice(1, -2) );
};

// for channel handling

Client.prototype.findOrCreateChannel = function(channelName) {
    if (!this.channels[channelName]) {
        this.channels[channelName] = new Channel(channelName);
    }
    return this.channels[channelName];
};

Client.prototype.findOrCreateUser = function(nick) {
    if (!this.users[nick]) {
        this.users[nick] = new User(nick);
    }
    return this.users[nick];
}

Client.prototype.on001 = function(message) {
    this.emit('register');
}

Client.prototype.on353 = function(message) {
    var type = message.params[1];
    var channelName = message.params[2];
    var users = message.params[3];

    var channel = this.findOrCreateChannel( channelName );

    switch(type) {
        case '@':
            channel.mode['s'] = true;
            break;
        case '*':
            channel.mode['p'] = true;
            break;
        case '=':
            // public
            break;
        default:
            // nop
    }

    var prefixes = '';
    var prefixToMode = {};
    for ( var mode in this.isupport.config.PREFIX ) {
        var prefix = this.isupport.config.PREFIX[ mode ];
        prefixToMode[ prefix ] = mode;
        prefixes += prefix;
    }
    users.split(' ').forEach((function(user) {
        var m = user.match( '^([' + prefixes + ']*)(.*)' );
        var nick  = m[2];
        var u = this.findOrCreateUser(nick);
        channel.users[nick] = u;
        m[1].split('').forEach( function(c) {
            u.mode[prefixToMode[c]] = true;
        } )
    }).bind(this));
};

Client.prototype.onPart = function(message) {
    var nick = message.nick;
    var channelName = message.params[0];

    var channel = this.findOrCreateChannel(channelName);
    delete channel.users[nick];
};

Client.prototype.onQuit = function(message) {
    var nick = message.nick;

    Object.keys(this.channels).forEach((function(channelName) {
        var channel = this.findOrCreateChannel(channelName);
        delete channel.users[nick];
    }).bind(this));
    delete this.users[nick];
};

Client.prototype.onKick = function(message) {
    message.params[0].split(/,/).forEach( (function(channelName) {
        var channel = this.findOrCreateChannel(channelName);
        message.params[1].split(/,/).forEach( function(nick) {
            delete channel.users[nick];
        });
    }).bind(this));
};

Client.prototype.onNick = function(message) {
    var oldNick = message.nick;
    var newNick = message.params[0];

    Object.keys(this.channels).forEach((function(channelName) {
        var channel = this.findOrCreateChannel(channelName);
        var user = this.findOrCreateUser(oldNick);

        delete channel.users[oldNick];
        delete this.users[oldNick];

        user.nick = newNick;
        channel.users[newNick] = user;
        this.users[newNick] = user;
    }).bind(this));
};

Client.prototype.onMode = function(message) {
    var target = message.params[0];

    if ( target.match( '[' + this.isupport.config.CHANTYPES + ']' ) ) {
        var addAndRemove = [].concat(
            this.isupport.config.CHANMODES[0],
            this.isupport.config.CHANMODES[1],
            Object.keys(this.isupport.config.PREFIX)
        );

        var paramModes = {
            add    : addAndRemove.concat( this.isupport.config.CHANTYPES[2] ),
            remove : addAndRemove
        };

        var modes = ModeParser.parse(message.params[1], message.params.slice(2), paramModes);

        var channel = this.findOrCreateChannel(target);
        modes.forEach( (function(e) {
            var direction = e[0];
            var mode      = e[1];
            var param     = e[2];

            if (Object.keys(this.isupport.config.PREFIX).indexOf( mode ) !== -1) {
                var user = this.findOrCreateUser(param);

                if (direction === 'add') {
                    user.mode[ mode ] = true;
                }
                else {
                    delete user.mode[ mode ];
                }
            }
            else {
                if (direction === 'add') {
                    channel.mode[ mode ] = param === null ? param : true;
                }
                else {
                    delete channel.mode[ mode ];
                }
            }
        }).bind(this));
    }
    else {
        var modes = ModeParser.parse(message.params[1], message.params.slice(2));

        modes.forEach( (function(e) {
            var direction = e[0];
            var mode      = e[1];

            if (direction === 'add') {
                this.mode[ mode ] = true;
            }
            else {
                delete this.mode[ mode ];
            }
        }).bind(this) );
    }
};

Client.prototype.onJoin = function(message) {
    var nick = message.nick;
    var channelName = message.params[0];

    var channel = this.findOrCreateChannel(channelName);
    var user = this.findOrCreateUser(nick);
    channel.users[nick] = user;
};

module.exports = Client;
