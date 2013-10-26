'use strict';

function AutoAway(options) {
    this.message = options.message || 'Sorry, I am away from IRC.';
}

AutoAway.prototype.handleUserSession = function( userSession, bouncer ) {
    userSession.on('attach', function() {
        if (bouncer.ircClient) {
            bouncer.ircClient.send( 'AWAY' ); // unaway
        }
    });
    userSession.on('close', (function() {
        if (!bouncer.isAttached() && bouncer.ircClient ) {
            bouncer.ircClient.send( 'AWAY', [this.message] ); // away
        }
    }).bind(this));
};

module.exports = AutoAway;
