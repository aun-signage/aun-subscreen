var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var pg = require('pg');

var SocialStream = require('./lib/social-stream');

var port = process.env.PORT || 3000;
var databaseUrl = process.env.DATABASE_URL;

var pgClient = new pg.Client(databaseUrl);
pgClient.connect(function(err) {
  if (err) {
    return console.error('failed to connect postgres', err);
  }
});

var socialStream = new SocialStream(process.env, pgClient);
socialStream.on('update', function(data) {
  var payload = data.payload;
  console.log('[' + payload.user.screen_name + '] ' + payload.text.replace(/\s+/, ' '));
});

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

