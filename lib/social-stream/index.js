var Twitter = require('./twitter');
var Irc = require('./irc');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

var SocialStream = module.exports = function(env, pgClient) {
  var self = this;

  var sweep = function(limit) {
    pgClient.query(
      'SELECT time FROM messages ORDER BY time DESC LIMIT 1 OFFSET $1',
      [limit],
      function(err, result) {
        if (err) {
          throw err;
        }
        if (result.rowCount > 0) {
          var timeThreshold = result.rows[0].time;
          console.info('Sweep messages older than ' + timeThreshold);
          pgClient.query(
            'DELETE FROM messages WHERE time <= $1',
            [timeThreshold],
            function(err, result) {
              if (err) {
                throw err;
              }
              console.info('%d message(s) swept', result.rowCount);
            }
          );
        }
      }
    );
  };
  var sweepThrottled = _.throttle(sweep, 5000);

  var store = function(type, time, payload) {
    pgClient.query(
      'INSERT INTO messages (type, time, payload) VALUES ($1, $2, $3)',
      [type, time, payload],
      function(err, result) {
        if (err) {
          throw 'Error in INSERT' + err;
        }
        if (env.MESSAGES_LIMIT) {
          sweepThrottled(env.MESSAGES_LIMIT);
        }
        self.emit('update', {type: type, time: time, payload: payload});
      }
    );
  };

  var receiveTwitter = function() {
    if (!env.TWITTER_AUTH || !env.TWITTER_QUERY) {
      console.info("Tweet receiver is not activated: You need to specify TWITTER_AUTH and TWITTER_QUERY to activate tweet receiver");
      return;
    }

    var tw = new Twitter(
      env.TWITTER_AUTH,
      env.TWITTER_QUERY
    );
    tw.on('tweet', function(data) {
      console.log('TW [%s] %s', data.user.screen_name, data.text.replace(/\s+/g, ' '));
      store('tweet', new Date(), data);
    });
  };

  var receiveIrc = function() {
    if (!env.IRC_SERVER || !env.IRC_NICK || !env.IRC_CHANNELS) {
      console.info("IRC Receiver is not activated: You need to specify IRC_SERVER, IRC_NICK and IRC_CHANNELS to activate IRC receiver");
      return;
    }

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

  receiveTwitter();
  receiveIrc();
};
util.inherits(SocialStream, EventEmitter);
