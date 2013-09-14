jQuery(document).ready(function($) {
  var socket = io.connect();

  var ViewModel = function(socket) {
    var self = this;
    var mySocket = socket;
    var mapping = {
      key: function(data) {
        return ko.utils.unwrapObservable(data.id);
      }
    };

    self.messages = ko.observableArray();

    mySocket.on('messages', function(messages) {
      self.messages(messages);
    });
  };

  ko.applyBindings(new ViewModel(socket));
});
