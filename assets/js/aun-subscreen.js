jQuery(document).ready(function($) {
  var options = {
    query: location.search.replace(/^\?/, '')
  };
  var socket = io.connect(null, options);

  var ViewModel = function(socket) {
    var self = this;
    var mySocket = socket;
    var mapping = {
      messages: {
        key: function(data) {
          return ko.utils.unwrapObservable(data.id);
        }
      }
    };

    self.messages = ko.observableArray();

    mySocket.on('update', function(data) {
      ko.mapping.fromJS(data, mapping, self);
    });
  };

  ko.applyBindings(new ViewModel(socket));
});
