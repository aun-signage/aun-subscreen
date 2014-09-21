package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"database/sql"
	_ "github.com/lib/pq"

	"github.com/darashi/aun-subscreen-ng/ddl"
	"github.com/darashi/aun-subscreen-ng/importer"
	"github.com/darashi/aun-subscreen-ng/listener"
	"github.com/darashi/aun-subscreen-ng/pinger"
	"github.com/darashi/aun-subscreen-ng/timeline"
)

var flagPort int
var flagMqttUrl string
var flagDatabaseUrl string
var flagMaxMessages int
var flagPingUrl string

func init() {
	flag.IntVar(&flagPort, "port", 8080, "port to listen")
	flag.IntVar(&flagMaxMessages, "max-messages", 9500, "max number of messages to retain; set 0 to retain all messages")
	flag.StringVar(&flagMqttUrl, "mqtt-url", "", "url to mqtt server")
	flag.StringVar(&flagDatabaseUrl, "database-url", "", "url to PostgreSQL")
	flag.StringVar(&flagPingUrl, "ping-url", "", "url to ping periodically")
}

func main() {
	flag.Parse()

	if flagMqttUrl == "" {
		log.Fatal("You must specity mqtt-url")
	}

	// database
	if flagDatabaseUrl == "" {
		log.Fatal("You must specity database-url")
	}
	db, err := sql.Open("postgres", flagDatabaseUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := ddl.Ensure(db, flagMaxMessages); err != nil {
		log.Fatal(err)
	}

	// keepalive
	if flagPingUrl == "" {
		log.Println("Keepalive: not configured")
	} else {
		log.Println("Keepalive:", flagPingUrl)
		go pinger.Ping(flagPingUrl)
	}

	// importer
	go func() {
		err := importer.Import(flagMqttUrl, db)
		if err != nil {
			log.Fatal(err)
		}
	}()

	// listener
	ch, err := listener.Listen(flagDatabaseUrl, "messages_insert")
	if err != nil {
		log.Fatal(err)
	}
	go func() {
		for _ = range ch {
			buf, err := timeline.Timeline(db)
			if err != nil {
				log.Fatal(err)
			}
			log.Println(string(buf))
			// TODO send to clients
		}
	}()

	// httpd
	addr := fmt.Sprintf(":%d", flagPort)

	http.Handle("/", http.FileServer(http.Dir("public")))

	log.Println("Listening", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}
