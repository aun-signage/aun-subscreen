var Twitter = require('./twitter');
var Irc = require('./irc');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var SocialStream = module.exports = function(env, pgClient) {
  var self = this;

  var store = function(type, time, payload) {
    pgClient.query(
      'INSERT INTO messages (type, time, payload) VALUES ($1, $2, $3)',
      [type, time, payload],
      function(err, result) {
        if (err) {
          throw 'Error in INSERT' + err;
        }
        self.emit('update', {type: type, time: time, payload: payload});
      }
    );
  };

  var tw = new Twitter(
    env.TWITTER_AUTH,
    env.TWITTER_QUERY
  );
  tw.on('tweet', function(data) {
    console.log('TW [%s] %s', data.user.screen_name, data.text.replace(/\s+/g, ' '));
    store('tweet', data.created_at, data);
  });

  var irc = new Irc(
    env.IRC_SERVER,
    env.IRC_PORT || 6667,
    env.IRC_NICK,
    env.IRC_CHANNELS
  );
  irc.on('message', function(message) {
    console.log('IRC %s <%s> %s', message.from, message.to, message.message);
    store('irc', new Date(), message);
  });
};
util.inherits(SocialStream, EventEmitter);
