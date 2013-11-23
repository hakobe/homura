'use strict';

function AutoNickServeIdentify(options) {
    this.nicks = options.nicks;
}

AutoNickServeIdentify.prototype.handleIrcClient = function(ircClient, bouncer) {
    if ( this.nicks[ bouncer.name ] ) {
        var config = this.nicks[ bouncer.name ];
        ircClient.on('register', (function () {
            ircClient.send( 'PRIVMSG', [
                'NickServ',
                'identify ' + config.password
            ]);
        }).bind(this));
    }
};

module.exports = AutoNickServeIdentify;
