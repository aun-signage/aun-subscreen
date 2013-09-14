var express = require('express');

module.exports = function(env, pgClient, socialStream) {
  var app = express();

  socialStream.on('update', function(data) {
    var payload = data.payload;
    console.log(
      '[' + payload.user.screen_name + '] ' +
      payload.text.replace(/\s+/g, ' ')
    );
    pgClient.query('SELECT COUNT(*) FROM messages', function(err, result) {
      var numMessages = result.rows[0].count;
      console.log('#messages: %s', numMessages);
    });
  });

  app.get('/', function(req, res) {
    app.set('views', __dirname);
    res.render('index.jade');
  });

  return app;
};
