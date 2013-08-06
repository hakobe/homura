'use strict';

function Channel(name) {
    this.name = name;
    this.topic = undefined;
    this.users = {};
    this.mode = {};
}

module.exports = Channel;
