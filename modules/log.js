'use strict';

var fs = require('fs');
var path = require('path');

function Log(options) {
    this.name = options.name;

    this.dir = options.dir || path.resolve( process.cwd(), 'logs' );
    if (this.dir[0] !== '/') {
        this.dir = path.resolve( process.cwd(), this.dir );
    }
    this.format  = options.format || '{bouncer}-{channel}-{year}{month}{date}.log';
}

Log.prototype.handleIrcClient = function( ircClient, bouncer ) {
    ircClient.on( 'connect', (function() {
        this.putLog(
            'Connected to IRC (' + bouncer.name + ')',
            bouncer.name
        );
    }).bind(this) );

    ircClient.on( 'close', (function() {
        this.putLog(
            'Closed connection to IRC (' + bouncer.name + ')',
            bouncer.name
        );
    }).bind(this) );

    ircClient.on( 'mode', (function(message) {
        if (message.params[0].match( '[' + ircClient.isupport.config.CHANTYPES + ']' )) { // only channel
            this.putLog(
                '*** ' + message.nick + ' sets modes: ' + message.params.slice(1).join(' '),
                bouncer.name,
                message.params[0]
            );
        }
    }).bind(this) );

    ircClient.on( 'kick', (function(message) {
        this.putLog(
            '*** ' + message.nick + ' kiecked ' + message.params[1] + ' : ' + message.params[2],
            bouncer.name,
            message.params[0]
        );
    }).bind(this) );

    ircClient.on( 'quit', (function(message) {
        Object.keys(ircClient.channels).forEach( (function(channelName) {
            this.putLog(
                '*** ' + message.nick + '(' + message.prefix + ')' + ' quit from IRC : ' + ( message.params[1] || '' ),
                bouncer.name,
                channelName
            );
        }).bind(this) );
    }).bind(this) );

    ircClient.on( 'join', (function(message) {
        this.putLog(
            '*** ' + message.nick + '(' + message.prefix + ')' + ' joins',
            bouncer.name,
            message.params[0]
        );
    }).bind(this) );

    ircClient.on( 'part', (function(message) {
        this.putLog(
            '*** ' + message.nick + '(' + message.prefix + ')' + ' parts',
            bouncer.name,
            message.params[0]
        );
    }).bind(this) );

    ircClient.on( 'nick', (function(message) {
        Object.keys(ircClient.channels).forEach( (function(channelName) {
            this.putLog(
                '*** ' + message.nick + ' is now known as ' + message.params[0],
                bouncer.name,
                channelName
            );
        }).bind(this) );
    }).bind(this) );

    ircClient.on( 'topic', (function(message) {
        this.putLog(
            '*** ' + message.nick + ' is changed topic to ' + message.params[1],
            bouncer.name,
            message.params[0]
        );
    }).bind(this) );

    ircClient.on( 'privmsg', (function(message) {
        this.putLog(
            '<' + message.nick + '> ' + message.params[1],
            bouncer.name,
            message.params[0]
        );
    }).bind(this) );

    ircClient.on( 'notice', (function(message) {
        this.putLog(
            '-' + message.nick + '- ' + message.params[1],
            bouncer.name,
            message.params[0]
        );
    }).bind(this) );
};

Log.prototype.handleUserSession = function( userSession, bouncer ) {
    userSession.on( 'privmsg', (function(message) {
        this.putLog(
            '<' + userSession.nick + '> ' + message.params[1],
            bouncer.name,
            message.params[0]
        );
    }).bind(this) );
    userSession.on( 'notice', (function(message) {
        this.putLog(
            '-' + userSession.nick + '- ' + message.params[1],
            bouncer.name,
            message.params[0]
        );
    }).bind(this) );
};

Log.prototype.putLog = function( line, bouncerName, target ) {
    var date = new Date();

    fs.appendFile(
        this.pathFor(this.format, date, bouncerName, target),
        this.formatedTimeFor(date) + ' ' + line + "\n",
        function (err) {
            if (err) { 
                throw err;
            }
        }
    );
};

Log.prototype.pathFor = function( format, date, bouncerName, target ) {
    if (!target) {
        target = 'status';
    }

    var year  = date.getFullYear();
    var month = date.getMonth() + 1;
    var date  = date.getDate();

    var fileName = format.
        replace(/{bouncer}/g, bouncerName.replace('/', '-')).
        replace(/{channel}/g, target.replace('/', '-')).
        replace(/{year}/g,  year  < 10 ? '0' + year  : year  ).
        replace(/{month}/g, month < 10 ? '0' + month : month ).
        replace(/{date}/g,  date  < 10 ? '0' + date  : date  );

    return path.resolve(this.dir, fileName);
};

Log.prototype.formatedTimeFor = function( date ) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();

    return '[' +
        ( hours   < 10 ? '0' + hours   : hours   ) + ':' +
        ( minutes < 10 ? '0' + minutes : minutes ) + ':' +
        ( seconds < 10 ? '0' + seconds : seconds ) + ']';
};

module.exports = Log;
