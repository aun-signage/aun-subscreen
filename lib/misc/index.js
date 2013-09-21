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
  }
};
