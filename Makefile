default: build

build:
	go build .

save:
	godep save .

run:
	go run main.go -mqtt-url "${MQTT_URL}" -database-url "${DATABASE_URL}" -ping-url "${HEROKU_URL}"

watch:
	jsx --watch client/ public/js

jsx:
	jsx client/ public/js
