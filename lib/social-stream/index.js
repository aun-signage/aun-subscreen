var Twitter = require('./twitter');
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
};
util.inherits(SocialStream, EventEmitter);
