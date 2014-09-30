package importer

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"time"

	"database/sql"
	"github.com/lib/pq"

	MQTT "git.eclipse.org/gitroot/paho/org.eclipse.paho.mqtt.golang.git"
)

func clientId() string {
	pid := os.Getpid()
	hostname, err := os.Hostname()
	if err != nil {
		return fmt.Sprintf("%d", pid)
	}
	return fmt.Sprintf("%s.%d", hostname, pid)
}

func mqttClient(mqttUrl string) (*MQTT.MqttClient, <-chan struct{}, error) {
	opts := MQTT.NewClientOptions()
	opts.AddBroker(mqttUrl)
	opts.SetCleanSession(true)
	opts.SetClientId(clientId())

	chConnectionLost := make(chan struct{})
	opts.SetOnConnectionLost(func(client *MQTT.MqttClient, reason error) {
		chConnectionLost <- struct{}{}
		log.Println("MQTT CONNECTION LOST", reason)
	})

	parsed, err := url.Parse(mqttUrl)
	if err != nil {
		return nil, nil, err
	}
	if user := parsed.User; user != nil {
		if username := user.Username(); username != "" {
			opts.SetUsername(username)
		}
		if password, set := user.Password(); set {
			opts.SetPassword(password)
		}
	}

	client := MQTT.NewClient(opts)
	_, err = client.Start()
	if err != nil {
		return nil, nil, err
	}

	return client, chConnectionLost, nil
}

func insertMessage(
	db *sql.DB,
	messageType string,
	t time.Time,
	payload []byte,
	text string,
) error {
	err := db.QueryRow(
		`INSERT INTO messages (type, time, payload, text) VALUES ($1, $2, $3, $4)`,
		messageType,
		t,
		payload,
		text,
	).Scan()

	if err, ok := err.(*pq.Error); ok {
		return err
	}

	return nil
}

type TweetUser struct {
	ScreenName string `json:"screen_name"`
}

type Tweet struct {
	TimestampMs string    `json:"timestamp_ms"`
	Text        string    `json:"text"`
	User        TweetUser `json:"user"`
}

func (tw *Tweet) Time() (*time.Time, error) {
	ms, err := strconv.Atoi(tw.TimestampMs)
	if err != nil {
		return nil, err
	}
	ns := int64(ms) * 1000000
	t := time.Unix(0, ns)
	return &t, nil
}

func insertTweet(
	db *sql.DB,
	payload []byte,
) error {
	var tweet Tweet
	err := json.Unmarshal(payload, &tweet)
	if err != nil {
		return err
	}
	re := regexp.MustCompile(`\s+`)
	text := re.ReplaceAllString(tweet.Text, " ")
	log.Printf("TW [@%s] %s", tweet.User.ScreenName, text)

	t, err := tweet.Time()
	if err != nil {
		return err
	}

	return insertMessage(
		db,
		"tweet",
		*t,
		payload,
		tweet.Text,
	)
}

type IrcMessage struct {
	From string `json:"from"`
	To   string `json:"to"`
	Text string `json:"text"`
}

func insertIrc(
	db *sql.DB,
	payload []byte,
) error {
	t := time.Now()

	var ircMessage IrcMessage
	err := json.Unmarshal(payload, &ircMessage)
	if err != nil {
		return err
	}
	log.Printf("IRC %s <%s> %s",
		ircMessage.To,
		ircMessage.From,
		ircMessage.Text,
	)

	return insertMessage(
		db,
		"irc",
		t,
		payload,
		ircMessage.Text,
	)
}

func Import(mqttUrl string, db *sql.DB) error {
	for {
		client, chConnectionLost, err := mqttClient(mqttUrl)
		if err != nil {
			return err
		}
		log.Println("MQTT CONNECTED")

		topicFilter, err := MQTT.NewTopicFilter("social-stream/#", 0)
		if err != nil {
			return err
		}

		subscriptionReciept, err := client.StartSubscription(
			func(client *MQTT.MqttClient, message MQTT.Message) {
				var err error
				switch topic := message.Topic(); topic {
				case "social-stream/tweet":
					err = insertTweet(db, message.Payload())
				case "social-stream/irc":
					err = insertIrc(db, message.Payload())
				default:
					log.Println("Unsupported topic '%s' received", topic)
				}
				if err != nil {
					log.Println(err)
				}
			}, topicFilter)
		if err != nil {
			return err
		}
		<-subscriptionReciept
		<-chConnectionLost
	}
}