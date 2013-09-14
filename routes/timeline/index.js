var express = require('express');

module.exports = function(env, socialStream) {
  var app = express();

  socialStream.on('update', function(data) {
    var payload = data.payload;
    console.log(
      '[' + payload.user.screen_name + '] ' +
      payload.text.replace(/\s+/, ' ')
    );
  });

  return app;
};
