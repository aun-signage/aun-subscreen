var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var pg = require('pg');
var compiless = require('express-compiless');

var SocialStream = require('./lib/social-stream');

var port = process.env.PORT || 3000;
var databaseUrl = process.env.DATABASE_URL;

var pgClient = new pg.Client(databaseUrl);
pgClient.connect(function(err) {
  if (err) {
    throw 'failed to connect postgres: ' + err;
  }
});

server.listen(port, function() {
  console.log('aun-subscreen now listening on ' + port);
});

io.configure(function () {
  io.set('transports', ['xhr-polling']);
  io.set('polling duration', 10);

  if (process.env.NODE_ENV == 'production') {
    io.set('log level', 1);
    io.enable('browser client minification');
    io.enable('browser client gzip');
  } else {
    io.set('log colors', true);
    io.set('log level', 2);
  }
});

io.sockets.on('connection', function (socket) {
  console.log('[' + socket.id + '] connected');

  socket.on('disconnect', function() {
    console.log('[' + socket.id + '] disconnected');
  });
});

var socialStream = new SocialStream(process.env, pgClient);
app.use(require('./routes/timeline')(process.env, io, pgClient, socialStream));

app.use(compiless({root: __dirname + '/public'}));
app.use(express.static(__dirname + '/public'));
