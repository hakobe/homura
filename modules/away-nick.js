'use strict';

function AwayNick(options) {
    this.awayNick = options.awayNick;
    if (!this.awayNick) {
        throw "awayNick option is required";
    }
    this.savedNicks = {};
}

AwayNick.prototype.handleIrcClient = function(ircClient, bouncer) {
    ircClient.on('305', (function()  { // unaway
        if (this.savedNicks[ bouncer.name ]) {
            ircClient.send('NICK', [this.savedNicks[ bouncer.name ]]);
        }
    }).bind(this));

    ircClient.on('306', (function()  { // away
        this.savedNicks[ bouncer.name ] = ircClient.nick;
        ircClient.send('NICK', [this.awayNick]);
    }).bind(this));
};

module.exports = AwayNick;
