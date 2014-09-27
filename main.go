package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"

	"database/sql"
	_ "github.com/lib/pq"

	"gopkg.in/igm/sockjs-go.v2/sockjs"

	"github.com/aun-signage/aun-subscreen/ddl"
	"github.com/aun-signage/aun-subscreen/dispatcher"
	"github.com/aun-signage/aun-subscreen/importer"
	"github.com/aun-signage/aun-subscreen/listener"
	"github.com/aun-signage/aun-subscreen/pinger"
)

var flagPort int
var flagMqttUrl string
var flagDatabaseUrl string
var flagMaxMessages int
var flagPingUrl string
var flagTwitterExcludeRegexp string
var flagTwitterExcludeScreenName string

const CHANNEL_MESSAGE_BUFFER_LENGTH = 10

func init() {
	flag.IntVar(&flagPort, "port", 8080, "port to listen")
	flag.IntVar(&flagMaxMessages, "max-messages", 9500, "max number of messages to retain; set 0 to retain all messages")
	flag.StringVar(&flagMqttUrl, "mqtt-url", "", "url to mqtt server")
	flag.StringVar(&flagDatabaseUrl, "database-url", "", "url to PostgreSQL")
	flag.StringVar(&flagPingUrl, "ping-url", "", "url to ping periodically")
	flag.StringVar(&flagTwitterExcludeRegexp, "twitter-exclude-regexp", "", "regexp to exlude from tweet stream")
	flag.StringVar(&flagTwitterExcludeScreenName, "twitter-exclude-screen-name", "", "screen names to exlude from tweet stream")
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

	// dispatcher
	opts := make(map[string]string)
	opts["twitter-exclude-regexp"] = flagTwitterExcludeRegexp
	opts["twitter-exclude-screen-name"] = flagTwitterExcludeScreenName
	d := dispatcher.NewDispatcher(db, opts)

	// listener
	ch, err := listener.Listen(flagDatabaseUrl, "messages_insert")
	if err != nil {
		log.Fatal(err)
	}
	go func() {
		for _ = range ch {
			if err := d.Dispatch(); err != nil {
				log.Println(err)
			}
		}
	}()

	// Sock.JS handler
	timelineHandler := createSockjsHandler(d)
	sockjsHandler := sockjs.NewHandler(
		"/timeline",
		sockjs.DefaultOptions,
		timelineHandler,
	)

	// httpd
	addr := fmt.Sprintf(":%d", flagPort)

	http.Handle("/timeline/", sockjsHandler)
	http.Handle("/", http.FileServer(http.Dir("public")))

	log.Println("Listening", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}

type Params struct {
	Query string `json:"query"`
}

func createSockjsHandler(d *dispatcher.Dispatcher) func(sockjs.Session) {
	return func(session sockjs.Session) {
		log.Printf("[%s] connected", session.ID())
		ch := make(chan []byte, CHANNEL_MESSAGE_BUFFER_LENGTH)

		defer d.Unsubscribe(ch)

		go func() {
			for buf := range ch {
				session.Send(string(buf))
			}
			// TODO handle; channel closed by dispatcher
		}()

		for {
			msg, err := session.Recv()
			if err != nil {
				log.Printf("[%s] %v", session.ID(), err)
				break
			}
			log.Printf("[%s] received %v", session.ID(), msg)
			var params Params
			err = json.Unmarshal([]byte(msg), &params)
			if err != nil {
				log.Printf("[%s] %v", session.ID(), err)
				break
			}
			d.Unsubscribe(ch)
			d.Subscribe(ch, params.Query)
			err = d.DispatchOne(ch, params.Query)
			if err != nil {
				log.Println(err)
			}
		}
		log.Printf("[%s] disconnected", session.ID())
	}
}
