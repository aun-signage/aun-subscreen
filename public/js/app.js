var sock = new SockJS('/timeline');
sock.onopen = function() {
  console.log('open');
};

sock.onmessage = function(e) {
  var data = JSON.parse(e.data);
  console.log('message', data);
};

sock.onclose = function() {
  console.log('close');
};
