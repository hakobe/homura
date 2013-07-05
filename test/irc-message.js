'use strict';

var expect = require('chai').expect;

var irc = require('../lib/irc');

describe('irc.Message', function() {
    describe('.constructor()', function() {
        it('should create message with prefix, command and params', function() {
            var message = new irc.Message('hakobe!~hakobe932@douzemille.net', 'NOTICE', ['#hakobe', 'hello']);
            expect(message).to.have.property('prefix', 'hakobe!~hakobe932@douzemille.net');
            expect(message).to.have.property('nick', 'hakobe');
            expect(message).to.have.property('user', '~hakobe932');
            expect(message).to.have.property('host', 'douzemille.net');
            expect(message).to.have.property('command', 'NOTICE');
            expect(message).to.have.property('params').that.eql([ '#hakobe', 'hello' ]);
        });
        it('should create mesage with empty property if no args are given', function() {
            var message = new irc.Message();
            expect(message).to.have.property('prefix').that.to.be.null;
            expect(message).to.not.have.property('nick');
            expect(message).to.not.have.property('user');
            expect(message).to.not.have.property('host');
            expect(message).to.have.property('command').that.to.be.null;
            expect(message).to.have.property('params').that.eql([]);
        });
    });
    describe('#parse()', function() {
        it('should parse command only message', function() {
            var parsed = irc.Message.parse('QUIT');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.have.property('prefix').that.to.be.null;
            expect(parsed).to.have.property('command', 'QUIT');
            expect(parsed).to.have.property('params').that.to.be.empty;
        });

        it('should parse no prefix message', function() {
            var parsed = irc.Message.parse('JOIN #hakobe932');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.have.property('prefix').that.to.be.null;
            expect(parsed).to.have.property('command', 'JOIN');
            expect(parsed).to.have.property('params').that.eql([ '#hakobe932' ]);
        });

        it('should parse no prefix message with multi params', function() {
            var parsed = irc.Message.parse('MODE #hakobe932 +t');
            expect(parsed).to.be.instanceof(irc.Message);
            expect(parsed).to.have.property('prefix').that.to.be.null;
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
    describe('#toRaw()', function() {
        it('should create raw message from command only message', function() {
            var raw = (new irc.Message(null, 'QUIT')).toRaw();
            expect(raw).to.equal('QUIT\r\n');
        });
        it('should create raw message from no prefix message', function() {
            var raw = (new irc.Message( null, 'JOIN', [ '#hakobe932' ] )).toRaw();
            expect(raw).to.equal('JOIN #hakobe932\r\n');
        });
        it('should create raw message from no prefix message with multi params', function() {
            var raw = (new irc.Message(null, 'MODE', [ '#hakobe932',  '+t' ])).toRaw();
            expect(raw).to.equal('MODE #hakobe932 +t\r\n');
        });
        it('should create raw message from message with server prefix', function() {
            var raw = (new irc.Message('hubbard.freenode.net', 'NOTICE', [ '*', 'hello' ])).toRaw();
            expect(raw).to.equal(':hubbard.freenode.net NOTICE * hello\r\n');
        });

        it('should create raw message from message with  user prefix', function() {
            var raw = (new irc.Message('hakobe!~hakobe932@douzemille.net', 'NOTICE', [ '#hakobe', 'hello' ])).toRaw();
            expect(raw).to.equal(':hakobe!~hakobe932@douzemille.net NOTICE #hakobe hello\r\n');
        });

        it('should create raw message from numeric command message [', function() {
            var raw = (new irc.Message('hubbard.freenode.net', '001', [ 'welcome' ])).toRaw();
            expect(raw).to.equal(':hubbard.freenode.net 001 welcome\r\n');
        });

        it('should create raw message from message with last arg with collon', function() {
            var raw = (new irc.Message('hakobe!~hakobe932@douzemille.net', 'PRIVMSG', [ '#hakobe', 'This is last argument including spaces and : symbols.'])).toRaw();
            expect(raw).to.equal(':hakobe!~hakobe932@douzemille.net PRIVMSG #hakobe :This is last argument including spaces and : symbols.\r\n');
        });

        it('should create raw message from multibyte args message', function() {
            var raw = (new irc.Message('hakobe!~hakobe932@douzemille.net', 'TOPIC', [ '#hakobe', 'こんにちは。 今日は良い天気です。'])).toRaw();
            expect(raw).to.equal(':hakobe!~hakobe932@douzemille.net TOPIC #hakobe :こんにちは。 今日は良い天気です。\r\n');
        });
    });
});

