'use strict';

function Topic(options) {
    this.content = options.content;
    this.who = options.who;
    this.time = options.time;
}

module.exports = Topic;
