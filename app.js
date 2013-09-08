var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log('aun-subscreen now listening on ' + port);
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

io.sockets.on('connection', function (socket) {
  console.log('[' + socket.id + '] connected');

  socket.on('disconnect', function() {
    console.log('[' + socket.id + '] disconnected');
  });
});

var Twitter = require('./lib/twitter');
var tw = new Twitter(
  process.env.TWITTER_AUTH,
  process.env.TWITTER_QUERY
);
tw.on('tweet', function(data) {
  console.log('[' + data.user.screen_name + '] ' + data.text.replace(/\s+/, ' '));
});
