var express = require('express');

module.exports = function(env, io, pgClient, socialStream) {
  var app = express();
  var limit = 20;

  socialStream.on('update', function(data) {
    pgClient.query(
      'SELECT * FROM messages ORDER BY time DESC LIMIT $1',
      [limit],
      function(err, result) {
        if (err) {
          throw 'Error in selecting ' + err;
        }
        console.log("HI");
        io.sockets.emit('message', result.rows);
      }
    );
  });

  app.get('/', function(req, res) {
    app.set('views', __dirname);
    res.render('index.jade');
  });

  return app;
};
