# aun-subscreen-ng

## Deployment

    $ heroku create --buildpack https://github.com/kr/heroku-buildpack-go.git
    $ heroku config:set MQTT_URL=[MQTT_URL]
    $ heroku addons:add heroku-postgresql:dev
