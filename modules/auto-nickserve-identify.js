'use strict';

function AutoNickServeIdentify(options) {
    this.passwords = options.passwords;
}

AutoNickServeIdentify.prototype.handleIrcClient = function(ircClient, bouncer) {
    if ( this.passwords[ bouncer.name ] ) {
        var password = this.passwords[ bouncer.name ];
        ircClient.on('register', (function () {
            ircClient.send( 'PRIVMSG', [
                'NickServ',
                'identify ' + password
            ]);
        }).bind(this));
    }
};

module.exports = AutoNickServeIdentify;
