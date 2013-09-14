jQuery(document).ready(function($) {
  var socket = io.connect();

  var ViewModel = function(socket) {
    var self = this;
    var mapping = {
      messages: {
        key: function(data) {
          return ko.utils.unwrapObservable(data._id);
        }
      }
    };

    self.messages = ko.observableArray();

    mySocket.on('message', function(data) {
      console.log(data);
      ko.mapping.fromJS(data, mapping, self);
    });
  };
});
