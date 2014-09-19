var http = require('http');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var pg = require('pg');
var _ = require('lodash');
var misc = require('./lib/misc');

var SocialStream = require('./lib/social-stream');

var port = process.env.PORT || 3000;
var databaseUrl = process.env.DATABASE_URL;

var pgClient = new pg.Client(databaseUrl);
pgClient.connect(function(err) {
  if (err) {
    throw 'failed to connect postgres: ' + err;
  }
});

pgClient.query(
  'SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name=\'messages\')',
  function(err, result) {
    if (err) {
      throw err;
    } else {
      if (!result.rows[0].exists) {
        misc.initializeDataBase(databaseUrl);
      }
    }
  }
);

server.listen(port, function() {
  console.log('aun-subscreen now listening on ' + port);
});

io.configure(function () {
  if (process.env.NODE_ENV == 'production') {
    io.set('log level', 1);
    io.enable('browser client minification');
    io.enable('browser client etag');
    io.enable('browser client gzip');
  } else {
    io.set('log colors', true);
    io.set('log level', 2);
  }
});

var connections = {};
io.sockets.on('connection', function (socket) {
  connections[socket.id] = true;
  console.log('[' + socket.id + '] connected. current: ' + _.size(connections) + ' connection(s)');

  socket.on('disconnect', function() {
    delete connections[socket.id];
    console.log('[' + socket.id + '] disconnected. current: ' + _.size(connections) + ' connection(s)');
  });
});

app.configure(function() {
  app.enable('trust proxy');
  app.use(express.compress());
});

app.configure('development', function() {
  app.use(express.logger('dev'));
});

app.configure('production', function() {
  app.use(express.logger());
});

var herokuUrl = process.env.HEROKU_URL;
if (herokuUrl) {
  console.log('Keepalive configured: ' + herokuUrl);
  setInterval(function() {
    http.get(herokuUrl, function(res) {
      console.log('Keepalive: ' + res.statusCode);
    }).on('error', function(err) {
      console.log('Error in ping: ' + err.message);
    });
  }, 20 * 60 * 1000);
}

var socialStream = new SocialStream(process.env, pgClient);
app.use(require('./routes/timeline')(process.env, io, pgClient, socialStream));

app.use(express.static(__dirname + '/public'));

var auth = express.basicAuth(
  process.env.ADMIN_USERNAME || 'admin',
  process.env.ADMIN_PASSWORD || 'admin'
);
app.use(auth)
app.use(require('./routes/setup/database')(process.env, databaseUrl));
