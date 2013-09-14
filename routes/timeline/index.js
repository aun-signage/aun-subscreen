var express = require('express');

module.exports = function(env, io, pgClient, socialStream) {
  var app = express();
  var limit = 20;

  var query = function(callback) {
    pgClient.query(
      'SELECT * FROM messages ORDER BY time DESC LIMIT $1',
      [limit],
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
    query(function(rows) {
      socket.emit('message', rows);
    });
  });

  socialStream.on('update', function(data) {
    query(function(rows) {
      io.sockets.emit('message', rows);
    });
  });

  return app;
};
