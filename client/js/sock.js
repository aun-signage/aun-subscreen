var sock = null;
var stream = function(query, callback) {
  var connect = function() {
    if (sock) {
      return;
    }

    sock = new SockJS('/timeline');

    sock.onopen = function() {
      var json = JSON.stringify({
        query: query
      });
      sock.send(json);
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
