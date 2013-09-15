var util = require('util');
var EventEmitter = require('events').EventEmitter;
var irc = require('irc');

var Irc = module.exports = function(server, port, nick, channels) {
  var channels = channels.split(',');
  var client = new irc.Client(server, nick, {
    port: port,
    channels: channels,
    userName: 'aun',
    fullName: 'aun: the kaigi signage system'
  });
  var self = this;

  console.log('IRC receiver configured for channels: %s', channels.join(', '));

  client.on('message', function (from, to, message) {
    self.emit('message', {from: from, to: to, message: message});
  });

  client.on('error', function(message) {
    console.log('IRC error: ', message);
  });
};
util.inherits(Irc, EventEmitter);
