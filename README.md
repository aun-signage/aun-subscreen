# aun-subscreen: the kaigi subscreen system

`aun-subscreen` is a re-implementation of a subset of *aun*. aun is the kaigi signage system, which was operated at [RubyKaigi 2013](http://rubykaigi.org/2013) and [RubyKaigi 2014](http://rubykaigi.org/2014). Since aun has lots of "RubyKaigi" specific features, it is too much for regular purpose.

`aun-subscreen` is just for "subscreen", which gives a timeline view of tweets and IRC messages. By keeping the scope small, the deployment becomes much more simple. We, team aun, hope to see aun energizes the communication in many conferences!

## Deploy to Heroku

### Deploy aun-receiver

You need to setup [aun-receiver](https://github.com/aun-signage/aun-receiver) to collect messages.
See [documents of aun-receiver](https://github.com/aun-signage/aun-receiver/blob/master/README.md) for detail.

### Create an application for aun-subscreen

```
$ heroku create --buildpack https://github.com/kr/heroku-buildpack-go.git
```

### Set environment variables

See [below](#configuration).

### Prepare database

See [documents](https://devcenter.heroku.com/articles/heroku-postgresql) for detail.

Create database:

```
$ heroku addons:add heroku-postgresql:dev
Adding heroku-postgresql:dev on aun-subscreen... done, v4 (free)
Attached as HEROKU_POSTGRESQL_AMBER_URL
Database has been created and is available
 ! This database is empty. If upgrading, you can transfer
 ! data from another database with pgbackups:restore.
Use `heroku addons:docs heroku-postgresql` to view documentation.
```

The part `HEROKU_POSTGRESQL_AMBER_URL` may vary.

Attach database:

```
$ heroku pg:promote HEROKU_POSTGRESQL_AMBER_URL
Promoting HEROKU_POSTGRESQL_AMBER_URL (DATABASE_URL) to DATABASE_URL... done
```

(Specify the same url as result in `addons:add heroku-postgresql:dev`)

### Push code

```
git push heroku master
```


## Configuration

You need to configure `aun-subscreen` with environment variables.
This is to play with PaaS deployment, such as [heroku](https://www.heroku.com/).

### Global Configurations

#### PORT

`aun-subscreen` will listen on the `PORT`.
heroku will set this automatically.

#### DATABASE\_URL

URL to PostgreSQL.

### MQTT\_URL

URL of source MQTT. Specify the same MQTT broker as `aun-receiver`.
Note that you can not specify `mqtt` here; you need use `tcp` instead.

#### MESSAGES\_LIMIT (optional)

Rough number of messages to keep in DB. This does not work exactly due to restriction of implementation.
As Heroku Postgres Dev database can keep only 10,000 rows, say, 9,500 will be reasonable value including margin.

```
MESSAGES_LIMIT=9500
```

If none specified, all messages will be kept.

#### HEROKU\_URL (optional)

Periodically ping this URL if specified to keep alive.
This is especially useful for deployment on heroku, since heroku gets down inactive web dynos unless more than one dynos reserved.

```
HEROKU_URL=http://[your-app-name].herokuapp.com
```

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

## Usage

Open `http://[Your Application Name].herokuapp.com` with your web browser.

You will see all messages received.

### Query parameters

You can have different views by specifying query parameters.

#### tweet

If you specify `?tweet=[Twitter Filtering Regexp]`, tweets matching with the regexp are shown.

#### irc

If you specify `?irc=test`, only messages on `#test` channels are shown. You can provide multiple channels separating with comma. If you want to show channels `#test1` and `#test2`, you need to specify `?irc=test1,test2`.

#### Combination

You can use `tweet` and `irc` parameters in combination. `?tweet=example&irc=test` will show tweets containing `example` in text and messages from IRC channel `#test`.

# Team aun

* [Yoji Shidara](https://github.com/darashi)
* [Jun Ohwada](https://github.com/june29)
* [Kei Shiratsuchi](https://github.com/kei-s)
* [Kengo Hamasaki](https://github.com/hmsk)

## Special Thanks!!

* [Norio Shimizu](https://github.com/norio)
