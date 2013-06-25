'use strict';

var irc = require('../lib/irc');
var expect = require('chai').expect;

describe('irc.Message', function() {
    describe('#parse()', function() {
        it('should parse command only message', function() {
            var parsed = irc.Message.parse('QUIT');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.not.have.property('prefix');
            expect(parsed).to.have.property('command', 'QUIT');
            expect(parsed).to.have.property('params').that.to.be.empty;
        });

        it('should parse no prefix message', function() {
            var parsed = irc.Message.parse('JOIN #hakobe932');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.not.have.property('prefix');
            expect(parsed).to.have.property('command', 'JOIN');
            expect(parsed).to.have.property('params').that.eql([ '#hakobe932' ]);
        });

        it('should parse no prefix message with multi params', function() {
            var parsed = irc.Message.parse('MODE #hakobe932 +t');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.not.have.property('prefix');
            expect(parsed).to.have.property('command', 'MODE');
            expect(parsed).to.have.property('params').that.eql([ '#hakobe932', '+t' ]);
        });

        it('should parse message with server prefix', function() {
            var parsed = irc.Message.parse(':hubbard.freenode.net NOTICE * hello');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.have.property('prefix', 'hubbard.freenode.net');
            expect(parsed).to.have.property('server', 'hubbard.freenode.net');
            expect(parsed).to.have.property('nick', 'hubbard.freenode.net');
            expect(parsed).to.not.have.property('user');
            expect(parsed).to.not.have.property('host');
            expect(parsed).to.have.property('command', 'NOTICE');
            expect(parsed).to.have.property('params').that.eql([ '*', 'hello' ]);
        });

        it('should parse message with user prefix', function() {
            var parsed = irc.Message.parse(':hakobe!~hakobe932@douzemille.net NOTICE #hakobe hello');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.have.property('prefix', 'hakobe!~hakobe932@douzemille.net');
            expect(parsed).to.not.have.property('server');
            expect(parsed).to.have.property('nick', 'hakobe');
            expect(parsed).to.have.property('user', '~hakobe932');
            expect(parsed).to.have.property('host', 'douzemille.net');
            expect(parsed).to.have.property('command', 'NOTICE');
            expect(parsed).to.have.property('params').that.eql([ '#hakobe', 'hello' ]);
        });

        it('should parse message with numeric command', function() {
            var parsed = irc.Message.parse(':hubbard.freenode.net 001 welcome');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.have.property('prefix', 'hubbard.freenode.net');
            expect(parsed).to.have.property('server', 'hubbard.freenode.net');
            expect(parsed).to.have.property('nick', 'hubbard.freenode.net');
            expect(parsed).to.not.have.property('user');
            expect(parsed).to.not.have.property('host');
            expect(parsed).to.have.property('command', '001');
            expect(parsed).to.have.property('params').that.eql([ 'welcome' ]);
        });

        it('should parse message with last arg with collon', function() {
            var parsed = irc.Message.parse(':hakobe!~hakobe932@douzemille.net PRIVMSG #hakobe :This is last argument including spaces and : symbols.');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.have.property('prefix', 'hakobe!~hakobe932@douzemille.net');
            expect(parsed).to.not.have.property('server');
            expect(parsed).to.have.property('nick', 'hakobe');
            expect(parsed).to.have.property('user', '~hakobe932');
            expect(parsed).to.have.property('host', 'douzemille.net');
            expect(parsed).to.have.property('command', 'PRIVMSG');
            expect(parsed).to.have.property('params').that.eql([ '#hakobe', 'This is last argument including spaces and : symbols.' ]);
        });

        it('should parse message with multibyte args', function() {
            var parsed = irc.Message.parse(':hakobe!~hakobe932@douzemille.net TOPIC #hakobe :こんにちは。 今日は良い天気です。');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.have.property('prefix', 'hakobe!~hakobe932@douzemille.net');
            expect(parsed).to.not.have.property('server');
            expect(parsed).to.have.property('nick', 'hakobe');
            expect(parsed).to.have.property('user', '~hakobe932');
            expect(parsed).to.have.property('host', 'douzemille.net');
            expect(parsed).to.have.property('command', 'TOPIC');
            expect(parsed).to.have.property('params').that.eql([ '#hakobe', 'こんにちは。 今日は良い天気です。' ]);
        });
    });
});

