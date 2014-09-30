default: build

build:
	cd client && gulp build
	go build .

save:
	godep save .

run:
	go run main.go -mqtt-url "${MQTT_URL}" -database-url "${DATABASE_URL}" -ping-url "${HEROKU_URL}" -twitter-exclude-regexp "${TWITTER_EXCLUDE_REGEXP}" -twitter-exclude-screen-name "${TWITTER_EXCLUDE_SCREEN_NAME}"

watch:
	cd client && gulp