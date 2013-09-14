var express = require('express');

module.exports = function(env, pgClient, socialStream) {
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
        result.rows.forEach(function(data) {
          var payload = data.payload;
          console.log('[' + payload.user.screen_name + '] ' + payload.text);
        });
      }
    );
  });

  app.get('/', function(req, res) {
    app.set('views', __dirname);
    res.render('index.jade');
  });

  return app;
};
