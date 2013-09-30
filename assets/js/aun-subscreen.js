jQuery(document).ready(function($) {
  var options = {
    query: location.search.replace(/^\?/, '')
  };
  var socket = io.connect(null, options);

  var ViewModel = function(socket) {
    var self = this;
    var mySocket = socket;

    self.messages = ko.observableArray();

    mySocket.on('messages', function(messages) {
      self.messages(messages);
    });
  };

  ko.applyBindings(new ViewModel(socket));
});
