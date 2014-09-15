var _ = require('lodash');

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
  initializeDataBase: function(client) {
    var executeQuery = function(query) {
      client.query(query, function(err, result) {
          if (err) {
            console.info('Failed: %s', query);
            throw 'Error executing: ' + err;
          }
          else {
            console.info('Executed: %s', query);
          }
        }
      );
    };
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
    console.info('Initialized Database');
  }
};
