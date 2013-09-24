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
    var values = [limit];
    var placeHolderIndex = 0;
    var val = function(value) {
      placeHolderIndex += 1;
      values[placeHolderIndex - 1] = value;
      return '$' + placeHolderIndex;
    };

    var sql = "SELECT * FROM messages";

    var conds = [];

    if (channel.tweet) {
      var tweetCond = "(payload ->> 'text') ~* " + val(channel.tweet);
      conds.push(tweetCond);
    }

    if (channel.irc) {
      var channels = channel.irc.split(',').map(function(channel) {
        if (channel[0] == '#') {
          return channel;
        } else {
          return '#' + channel;
        }
      });
      var ircCond = "(type = 'irc') AND (payload ->> 'to' = " + val(channels[0]) + ")";
      // XXX doesn't work with multiple channels

      conds.push(ircCond);
    }

    if (conds.length > 0) {
      sql += " WHERE " + conds.map(function(cond) {
        return "(" + cond + ")";
      }).join(" OR ");
    } else {
      sql += " WHERE FALSE"
    }

    sql += " ORDER BY time DESC";
    sql += " LIMIT " + val(limit);

    return {sql: sql, values: values};
  }

  var query = function(channel, callback) {
    var q = buildQuery(channel);
    console.log(q);
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
