var sock = null;
var stream = function(callback) {
  var connect = function() {
    if (sock) {
      return;
    }

    sock = new SockJS('/timeline');

    sock.onopen = function() {
      // connected
    };

    sock.onmessage = function(e) {
      var data = JSON.parse(e.data);
      callback(data);
    };

    sock.onclose = function() {
      sock = null;
    };
  };

  connect();
  setInterval(connect, 2000);
};
