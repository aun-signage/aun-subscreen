var express = require('express');
var misc = require('../../lib/misc');

module.exports = function(env, databaseUrl) {
  var app = express();
  app.get('/initialize', function(req, res) {
    misc.initializeDataBase(databaseUrl);
    res.redirect('/');
  });
  return app;
};
