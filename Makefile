default: build

build:
	cd client && gulp build
	go build .

save:
	godep save .

run:
	go run main.go -mqtt-url "${MQTT_URL}" -database-url "${DATABASE_URL}" -ping-url "${HEROKU_URL}"

watch:
	cd client && gulp watch
