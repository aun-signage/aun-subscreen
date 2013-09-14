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

    mySocket.on('message', function(data) {
      self.messages(data);
    });
  };

  ko.applyBindings(new ViewModel(socket));
});
