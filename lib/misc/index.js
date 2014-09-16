var _ = require('lodash');
var pg = require('pg');

module.exports = {
  activeChannels: function(io, namespace) {
    return _.keys(this.activeChannelsWithClients(io, namespace));
  },
  activeChannelsWithClients: function(io, namespace) {
    var regexp = new RegExp('^' + namespace + '/(.+)$');
    var channels = {};
    _(io.sockets.manager.rooms).each(function(clients, room) {
      var matched = room.match(regexp);
      if (matched) {
        var channelId = matched[1];
        channels[channelId] = clients;
      }
    });
    return channels;
  },
  initializeDataBase: function(databaseUrl) {
    var client = new pg.Client(databaseUrl);
    _.forEach([
      'DROP TABLE IF EXISTS messages',
      'CREATE TABLE messages ( id SERIAL PRIMARY KEY, type CHARACTER VARYING(255) NOT NULL, time TIMESTAMP WITH TIME ZONE NOT NULL, text CHARACTER VARYING(255) NOT NULL, payload JSON NOT NULL)',
      'DROP INDEX IF EXISTS messages_time',
      'CREATE INDEX messages_time ON messages (time)',
      'DROP INDEX IF EXISTS messages_channel',
      'CREATE INDEX messages_channel ON messages ((payload ->> \'to\')) WHERE type = \'irc\'',
      'DROP INDEX IF EXISTS messages_screen_name',
      'CREATE INDEX messages_screen_name ON messages ((payload -> \'user\' ->> \'screen_name\')) WHERE type = \'tweet\'',
      'DROP INDEX IF EXISTS messages_text',
      'DROP EXTENSION IF EXISTS pg_trgm',
      'CREATE EXTENSION pg_trgm',
      'CREATE INDEX messages_text ON messages USING gin (text gin_trgm_ops) WHERE type = \'tweet\''
    ], function(query) {
      var q = client.query(query);
      q.on('error', function(err) {
        console.info('Failed: %s', query);
        throw err;
      });
      q.on('end', function() {
        console.info('Executed: %s', query)
      });
    });

    client.on('drain', function() {
      console.info("Drained initializing queries");
      client.end.bind(client);
    });

    client.connect();
  }
};
