var util = require('util');
var irc = require('../irc');

function Client(options) {
    var self = this;
    irc.Client.call(self, options);

    self.channels = {};
}

util.inherits(Client, irc.Client);

module.exports = Client;
