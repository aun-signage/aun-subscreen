var express = require('express');
var misc = require('../../lib/misc');

module.exports = function(env, io, pgClient, socialStream) {
  var app = express();
  var limit = 20;

  /*
  var buildQuery = function(channel) {
    var s = squel.select()
      .from('messages')
      .order('time', false)
      .limit(limit);

    var conds = [];
    var values = [];
    if (channel.tweet) {
      conds.push("(type = 'tweet' AND (payload ->> 'text') ~* ?)");
      values.push(channel.tweet);
    }
    if (channel.irc) {
      // TODO consider irc channels
      conds.push("(type = 'irc')");
    }
    s.where(conds.join(" OR "), values);

    if (env.TWITTER_EXCLUDE_REGEXP) {
      s.where(
        "NOT (type = 'tweet' AND (payload ->> 'text') ~* ?)",
        env.TWITTER_EXCLUDE_REGEXP
      );
    }

    if (env.TWITTER_EXCLUDE_SCREEN_NAME) {
      var screenNames = env.TWITTER_EXCLUDE_SCREEN_NAME.split(',');
      s.where(
        "NOT (type = 'tweet' AND (payload -> 'user' ->> 'screen_name') IN ?)",
        screenNames
      );
    }

    return s.toString();
  };
 */
  var buildQuery = function(channel) {
    var sql = "SELECT * FROM messages LIMIT $1";
    var values = [limit];

    return {sql: sql, values: values};
  }

  var query = function(channel, callback) {
    var q = buildQuery(channel);
    pgClient.query(q.sql,
      q.values,
      function(err, result) {
        if (err) {
          throw 'Error in selecting ' + err;
        }
        callback(result.rows);
      }
    );
  };

  app.get('/', function(req, res) {
    app.set('views', __dirname);
    res.render('index.jade');
  });

  io.sockets.on('connection', function (socket) {
    var channel = {
      tweet: socket.handshake.query.tweet,
      irc: socket.handshake.query.irc
    };
    socket.join(JSON.stringify(channel));
    console.log('[%s] subscribed %j', socket.id, channel);

    query(channel, function(messages) {
      socket.emit('messages', messages);
    });
  });

  socialStream.on('update', function(data) {
    var channels = misc.activeChannels(io, '');
    channels.forEach(function(channelJson) {
      var channel = JSON.parse(channelJson);
      query(channel, function(messages) {
        io.sockets.in(channelJson).emit('messages', messages);
      });
    });
  });

  return app;
};
