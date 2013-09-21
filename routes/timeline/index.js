var express = require('express');
var squel = require('squel');

module.exports = function(env, io, pgClient, socialStream) {
  var app = express();
  var limit = 20;

  var query = function(callback) {
    var s = squel.select()
      .from('messages')
      .order('time', false)
      .limit(limit);
    pgClient.query(
      s.toString(),
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
