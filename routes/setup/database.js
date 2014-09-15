var express = require('express');
var misc = require('../../lib/misc');

module.exports = function(env, pgClient) {
  var app = express();
  var executeQuery = function(query) {
    pgClient.query(query, function(err, result) {
        if (err) {
          console.info('Failed: %s', query);
          throw 'Error executing: ' + err;
        }
        else {
          console.info('Executed: %s', query);
        }
      }
    );
  }

  app.get('/initialize', function(req, res) {
    misc.initializeDataBase(pgClient);
    res.redirect('/');
  });
  return app;
};
