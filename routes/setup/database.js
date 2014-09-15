var express = require('express');

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
    executeQuery('DROP TABLE IF EXISTS messages');
    executeQuery('CREATE TABLE messages ( id SERIAL PRIMARY KEY, type CHARACTER VARYING(255) NOT NULL, time TIMESTAMP WITH TIME ZONE NOT NULL, text CHARACTER VARYING(255) NOT NULL, payload JSON NOT NULL)');
    executeQuery('DROP INDEX IF EXISTS messages_time');
    executeQuery('CREATE INDEX messages_time ON messages (time)');
    executeQuery('DROP INDEX IF EXISTS messages_channel');
    executeQuery('CREATE INDEX messages_channel ON messages ((payload ->> \'to\')) WHERE type = \'irc\'');
    executeQuery('DROP INDEX IF EXISTS messages_screen_name');
    executeQuery('CREATE INDEX messages_screen_name ON messages ((payload -> \'user\' ->> \'screen_name\')) WHERE type = \'tweet\'');
    executeQuery('DROP INDEX IF EXISTS messages_text');
    executeQuery('DROP EXTENSION IF EXISTS pg_trgm');
    executeQuery('CREATE EXTENSION pg_trgm');
    executeQuery('CREATE INDEX messages_text ON messages USING gin (text gin_trgm_ops) WHERE type = \'tweet\'');
    res.redirect('/');
  });
  return app;
};
