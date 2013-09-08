var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Ntwitter = require('ntwitter');

var Twitter = module.exports = function(auth, query) {
  var self = this;
  var values = auth.split(':');
  var twit = new Ntwitter({
    consumer_key: values[0],
    consumer_secret: values[1],
    access_token_key: values[2],
    access_token_secret: values[3]
  });
  var params = {
    track: query
  };

  console.log("Twitter receiver configured: %j", params);

  twit.stream('statuses/filter', params, function(stream) {
    stream.on('data', function (data) {
      self.emit('tweet', data);
    });
  });
  // TODO reconnect if stalled
};
util.inherits(Twitter, EventEmitter);
