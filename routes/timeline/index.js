var express = require('express');
var squel = require('squel');

module.exports = function(env, io, pgClient, socialStream) {
  var app = express();
  var limit = 20;

  var queryBuilder = function() {
    var s = squel.select()
      .from('messages')
      .order('time', false)
      .limit(limit);

    if (env.TWITTER_EXCLUDE_REGEXP) {
      s = s.where(
        "NOT (type = 'twitter' AND (payload ->> 'text') ~* ?)",
        env.TWITTER_EXCLUDE_REGEXP
      );
    }

    return s.toString();
  };

  var query = function(callback) {
    var sql = queryBuilder();
    pgClient.query(sql,
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
    query(function(messages) {
      socket.emit('messages', messages);
    });
  });

  socialStream.on('update', function(data) {
    query(function(messages) {
      io.sockets.emit('messages', messages);
    });
  });

  return app;
};
