'use strict';

function Channel(name) {
    this.name = name;
    this.users = {};
    this.mode = {};
}

module.exports = Channel;
