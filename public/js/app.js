var sock = null;

var connect = function() {
  if (sock) {
    return;
  }

  sock = new SockJS('/timeline');

  sock.onopen = function() {
    console.log('open');
  };

  sock.onmessage = function(e) {
    var data = JSON.parse(e.data);
    console.log('message', data);
  };

  sock.onclose = function() {
    console.log('close');
    sock = null;
  };
};

connect();
setInterval(connect, 2000);
