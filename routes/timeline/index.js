var express = require('express');
var misc = require('../../lib/misc');

module.exports = function(env, io, pgClient, socialStream) {
  var app = express();
  var limit = 20;

  var buildQuery = function(channel) {
    var values = [limit];
    var placeHolderIndex = 0;
    var val = function(value) {
      placeHolderIndex += 1;
      values[placeHolderIndex - 1] = value;
      return '$' + placeHolderIndex;
    };
    var inVals = function(values) {
      return 'IN (' + values.map(function(value) {
        return val(value);
      }).join(' ,') + ')';
    };

    var sql = "SELECT * FROM messages";

    var orConds = [];
    var conds = [];

    if (channel.tweet) {
      var tweetCond = "(payload ->> 'text') ~* " + val(channel.tweet);
      orConds.push(tweetCond);
    }

    if (channel.irc) {
      var channels = channel.irc.split(',').map(function(channel) {
        return channel[0] == '#' ? channel : '#' + channel;
      });
      var ircCond = "(type = 'irc') AND (payload ->> 'to' " + inVals(channels) + ")";

      orConds.push(ircCond);
    }

    if (orConds.length > 0) {
      var orCondsStr = orConds.map(function(cond) {
        return "(" + cond + ")";
      }).join(" OR ");
      conds.push(orCondsStr);
    }

    if (env.TWITTER_EXCLUDE_REGEXP) {
      conds.push(
        "NOT (type = 'tweet' AND (payload ->> 'text') ~* " +
        val(env.TWITTER_EXCLUDE_REGEXP) + ")"
      );
    }

    if (env.TWITTER_EXCLUDE_SCREEN_NAME) {
      var screenNames = env.TWITTER_EXCLUDE_SCREEN_NAME.split(',');
      conds.push(
        "NOT (type = 'tweet' AND (payload -> 'user' ->> 'screen_name') " +
        inVals(screenNames) + ")"
      );
    }

    if (conds.length > 0) {
      sql += " WHERE " + conds.map(function(cond) {
        return "(" + cond + ")";
      }).join(" AND ");
    }

    sql += " ORDER BY time DESC";
    sql += " LIMIT " + val(limit);

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

  var lastMessagesJson = {};

  socialStream.on('update', function(data) {
    var channels = misc.activeChannels(io, '');
    channels.forEach(function(channelJson) {
      var channel = JSON.parse(channelJson);
      query(channel, function(messages) {
        // Do not send the same messages on every update
        var messagesJson = JSON.stringify(messages);
        if (lastMessagesJson[channelJson] != messagesJson) {
          lastMessagesJson[channelJson] = messagesJson;
          io.sockets.in(channelJson).emit('messages', messages);
        }
      });
    });
  });

  return app;
};
