# aun-subscreen: the kaigi subscreen system

`aun-subscreen` is a re-implementation of a subset of *aun*. *aun* is the kaigi signage system, which was operated at [RubyKaigi 2013](http://rubykaigi.org/2013). Since *aun* has lots of "RubyKaigi" specific features, it is too much for regular purpose.

`aun-subscreen` is just for "subscreen", which gives a timeline view of tweets and IRC messages. By keeping the scope small, the deployment becomes much more simple. We, team aun, hope to see *aun* energizes the communication in many conferences!

# Requirements

* [Node.js](http://nodejs.org/)
* [PostgreSQL](http://www.postgresql.org/) 9.3 (won't work with 9.2.x)

# Deployment

Create an application:

```
heroku create [Your Application Name]
```

Enable Websockets:

```
heroku labs:enable websockets
```

## Set environment variables

See [below](#configuration).

## Prepare database

See [documents](https://devcenter.heroku.com/articles/heroku-postgresql) for detail.

Create database:

```
$ heroku addons:add heroku-postgresql:dev --version=9.3
Adding heroku-postgresql:dev on aun-subscreen... done, v7 (free)
Attached as HEROKU_POSTGRESQL_ORANGE_URL
Database has been created and is available
 ! This database is empty. If upgrading, you can transfer
 ! data from another database with pgbackups:restore.
Use `heroku addons:docs heroku-postgresql` to view documentation.
```

Make sure to add `--version=9.3` option. The part `HEROKU_POSTGRESQL_ORANGE_URL` may vary.

Attach database:

```
heroku pg:promote HEROKU_POSTGRESQL_ORANGE_URL
Promoting HEROKU_POSTGRESQL_ORANGE_URL to DATABASE_URL... done
```

(Specify the same url as result in `addons:add heroku-postgresql:dev`)

Load ddl:

```
psql -f db/ddl.sql [DATABASE_URL]
```

Note: This requires local setup of `psql` command.


## Push code

```
git push heroku master
```


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


### MESSAGES\_LIMIT (optional)

Rough number of messages to keep in DB. This does not work exactly due to restriction of implementation.
As Heroku Postgres Dev database can keep only 10,000 rows, say, 9,500 will be reasonable value including margin.

```
MESSAGES_LIMIT=9500
```

If none specified, all messages will be kept.

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


### IRC\_PORT (optional)

Port number of the IRC server.

Example:

```
IRC_PORT=6667
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

# Usage

Open `http://[Your Application Name].herokuapp.com` with your web browser.

You will see all messages received.

## Query parameters

You can have different views by specifying query parameters.

### tweet

If you specify `?tweet=[Twitter Filtering Regexp]`, tweets matching with the regexp are shown.

### irc

If you specify `?irc=test`, only messages on `#test` channels are shown. You can provide multiple channels separating with comma. If you want to show channels `#test1` and `#test2`, you need to specify `?irc=test1,test2`.

### Combination

You can use `tweet` and `irc` parameters in combination. `?tweet=example&irc=test` will show tweets containing `example` in text and messages from IRC channel `#test`.

# Team aun

* [Yoji Shidara](https://github.com/darashi)
* [Jun Ohwada](https://github.com/june29)
* [Kei Shiratsuchi](https://github.com/kei-s)
* [Kengo Hamasaki](https://github.com/hmsk)

## Special Thanks!!

* [Norio Shimizu](https://github.com/norio)
