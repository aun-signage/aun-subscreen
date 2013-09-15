var Twitter = require('./twitter');
var Irc = require('./irc');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var SocialStream = module.exports = function(env, pgClient) {
  var self = this;
  var tw = new Twitter(
    env.TWITTER_AUTH,
    env.TWITTER_QUERY
  );
  tw.on('tweet', function(data) {
    pgClient.query(
      'INSERT INTO messages (type, time, payload) VALUES ($1, $2, $3)',
      ['tweet', data.created_at, data],
      function(err, result) {
        if (err) {
          throw 'Error in INSERT' + err;
        }
        self.emit('update', {type: 'tweet', payload: data});
      }
    );
  });

  var irc = new Irc(
    env.IRC_SERVER,
    env.IRC_PORT || 6667,
    env.IRC_NICK,
    env.IRC_CHANNELS
  );
  irc.on('message', function(message) {
    console.log('IRC %s <%s> %s', message.from, message.to, message.message);
    pgClient.query(
      'INSERT INTO messages (type, time, payload) VALUES ($1, $2, $3)',
      ['irc', new Date(), message],
      function(err, result) {
        if (err) {
          throw 'Error in INSERT' + err;
        }
        self.emit('update', {type: 'irc', payload: message});
      }
    );
  });
};
util.inherits(SocialStream, EventEmitter);
