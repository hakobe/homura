var net = require('net');
var util = require('util');
var events = require('events');

var Log = require('../util/log');
var Message = require('./message');
var Isupport = require('./isupport');
var Channel = require('./channel');
var User = require('./user');
var ModeParser = require('./mode_parser');

function Client(options) {
    var self = this;

    self.server   = options.server;
    self.port     = options.port;
    self.nick     = options.nick;
    self.user     = options.user;
    self.real     = options.real;
    self.password = options.password;
    self.debug    = options.debug || false;

    self.mode     = {};
    self.isupport = new Isupport();
    self.channels = {};
    self.users    = {};

    events.EventEmitter.call(this);

    if (self.debug) {
        Log.level = Log.DEBUG;
    }

    self.on('raw', function(message) {
        Log.debug('<irc.Client> received raw message: ' + message.toRaw());
        var meth = 'on_' + message.command.toLowerCase();
        meth = meth.replace(/_./g, function($0) {
            return $0[1].toUpperCase();
        });
        if ( this[ meth ] ) {
            this[ meth ].call(this, message);
        }
        self.emit( message.command.toLowerCase(), message );
    });
    self.on('error', function() { });
}

util.inherits(Client, events.EventEmitter);

Client.prototype.connect = function() {
    this.connection = net.connect({
        host : this.server,
        port : this.port,
    }, (function() {
        Log.debug('<irc.Client> connect!!');
        if (this.password) {
            this.send('PASS', [ this.password ]);
        }
        this.send('NICK', [ this.nick ]);
        this.send('USER', [ this.user, '0', '*', this.real ]);
        this.emit('connect');
    }).bind(this));
    this.connection.setEncoding('utf8');
    this.connection.setTimeout(0);

    var buffer = '';
    this.connection.on('data', (function(data) {
        buffer += data;
        var lines = buffer.split("\r\n");
        buffer = lines.pop();

        lines.forEach( (function(line) {
            this.emit( 'raw', Message.parse( line ) )
        }).bind(this) );
    }).bind(this));
    this.connection.on('end', function() {
        Log.debug("<irc.Client> connection end");
    });
    this.connection.on('close', (function() {
        Log.debug("<irc.Client> connection closed");
        this.emit('close');
    }).bind(this));
    this.connection.on('error', function() {
        Log.debug("<irc.Client> network error: " + message.toRaw());
    });
};

Client.prototype.send = function(command, params) {
    var message = new Message( null, command, params );
    Log.debug("<irc.Client> Sending message: " + message.toRaw());
    this.connection.write( message.toRaw() );
};

Client.prototype.onError = function(message) {
    Log.info("<irc.Client> received error: " + message.toRaw());
}

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
    Log.debug('<irc.Clinet> server is successfully registered');
    this.emit('register');
}

Client.prototype.on353 = function(message) {
    var self = this;
    var type = message.params[1];
    var channelName = message.params[2];
    var users = message.params[3];

    var channel = self.findOrCreateChannel( channelName );

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
    for ( var mode in self.isupport.config.PREFIX ) {
        var prefix = self.isupport.config.PREFIX[ mode ];
        prefixToMode[ prefix ] = mode;
        prefixes += prefix;
    }
    users.split(' ').forEach(function(user) {
        var m = user.match( '^([' + prefixes + ']*)(.*)' );
        var nick  = m[2];
        var u = self.findOrCreateUser(nick);
        channel.users[nick] = u;
        m[1].split('').forEach( function(c) {
            u.mode[prefixToMode[c]] = true;
        } )
    });
};

Client.prototype.onPart = function(message) {
    var nick = message.nick;
    var channelName = message.params[0];

    var channel = this.findOrCreateChannel(channelName);
    delete channel.users[nick];
};

Client.prototype.onQuit = function(message) {
    var self = this;
    var nick = message.nick;

    Object.keys(self.channels).forEach(function(channelName) {
        var channel = self.findOrCreateChannel(channelName);
        delete channel.users[nick];
    });
    delete self.users[nick];
};

Client.prototype.onKick = function(message) {
    var self = this;
    message.params[0].split(/,/).forEach( function(channelName) {
        var channel = self.findOrCreateChannel(channelName);
        message.params[1].split(/,/).forEach( function(nick) {
            delete channel.users[nick];
        });
    });
};

Client.prototype.onNick = function(message) {
    var self = this;

    var oldNick = message.nick;
    var newNick = message.params[0];

    Object.keys(self.channels).forEach(function(channelName) {
        var channel = self.findOrCreateChannel(channelName);
        var user = self.findOrCreateUser(oldNick);

        delete channel.users[oldNick];
        delete self.users[oldNick];

        user.nick = newNick;
        channel.users[newNick] = user;
        self.users[newNick] = user;
    });
};

Client.prototype.onMode = function(message) {
    var self = this;
    var target = message.params[0];

    if ( target.match( '[' + self.isupport.config.CHANTYPES + ']' ) ) {
        var addAndRemove = [].concat(
            self.isupport.config.CHANMODES[0],
            self.isupport.config.CHANMODES[1],
            Object.keys(self.isupport.config.PREFIX)
        );

        var paramModes = {
            add    : addAndRemove.concat( self.isupport.config.CHANTYPES[2] ),
            remove : addAndRemove
        };

        var modes = ModeParser.parse(message.params[1], message.params.slice(2), paramModes);

        var channel = self.findOrCreateChannel(target);
        modes.forEach( function(e) {
            var direction = e[0];
            var mode      = e[1];
            var param     = e[2];

            if (Object.keys(self.isupport.config.PREFIX).indexOf( mode ) !== -1) {
                var user = self.findOrCreateUser(param);

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
        });
    }
    else {
        var modes = ModeParser.parse(message.params[1], message.params.slice(2));

        modes.forEach( function(e) {
            var direction = e[0];
            var mode      = e[1];

            if (direction === 'add') {
                self.mode[ mode ] = true;
            }
            else {
                delete self.mode[ mode ];
            }
        });
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
