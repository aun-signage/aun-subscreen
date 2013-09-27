# aun-subscreen: the kaigi subscreen system

`aun-subscreen` is a re-implementation of a subset of *aun*, the kaigi signage system, which was operated at [RubyKaigi 2013](http://rubykaigi.org/2013). Since *aun* has lots of "RubyKaigi" specific features, it is too much for regular purpose.

`aun-subscreen` is just for "subscreen", which gives a timeline views of tweets and IRC messages. By keeping the scope small, the deployment becomes much more simple. We, aun team, want to see *aun* energizes the communication in many conferences.

# Requirements

* [Node.js](http://nodejs.org/)
* [PostgreSQL](http://www.postgresql.org/) 9.3 (won't work with 9.2.x)

# Configuration

You need to configure `aun-subscreen` with environment variables.
This is to play with PaaS deployment, such as [heroku](https://www.heroku.com/).

For development or deployment on local machines, [foreman](https://github.com/ddollar/foreman) is useful to keep environment variables and `sub-subcreen` to be running.

## Global Configurations

### NODE\_ENV

Use `production` for production.

```
NODE_ENV=production
```

### PORT

`aun-subscreen` will listen on the `PORT`.
heroku will set this automatically.

### DATABASE\_URL

URL to PostgreSQL.
heroku will set this automatically.

## Twitter Receiver Configurations

If you want to receive twitter stream, you need to set these variables.

### TWITTER\_AUTH

Credentials for twitter. Tokens should be concatenated with ':'.

```
TWITTER_AUTH=[Consumer key]:[Consumer secret]:[Access token]:[Access token secret]
```

### TWITTER\_QUERY

Strings to track.

Example:

```
TWITTER_QUERY=aun,rubykaigi
```

* `TWITTER_QUERY` should be comma separated

## IRC Receiver Configurations

If you want to receive messages from IRC, you need to set these variables.

### IRC\_SERVER

Hostname of the IRC server.

Example:

```
IRC_SERVER=irc.example.com
```


### IRC\_PORT

Port number of the IRC server.

Example:

```
PORT=6667
```

### IRC\_NICK

Nick to use to connect the IRC server.

Example:

```
IRC_NICK=aun-receiver
```

### IRC\_CHANNELS

Channels to join.

EXAMPLE:

```
IRC_CHANNELS=#test1,#test2
```

* `IRC_CHANNELS` should be comma separated

## Filters

You may want to hide some tweets from screen. This is for it.
Two types of filters are available: regular expression based filter and screen name based filter.

### TWITTER\_EXCLUDE\_REGEXP

Regexp to exclude tweets from screen.

Example (to exclude RTs):

```
TWITTER_EXCLUDE_REGEXP=^RT
```

* `TWITTER_EXCLUDE_REGEXP` should be a regular expression

### TWITTER\_EXCLUDE\_SCREEN\_NAME

Screen names to exclude from screen.

```
TWITTER_EXCLUDE_SCREEN_NAME=[Screen Names]
```

* `TWITTER_EXCLUDE_SCREEN_NAME` should be comma separated
