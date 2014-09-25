package dispatcher

import (
	"database/sql"
	"log"
	"sync"

	"github.com/darashi/aun-subscreen-ng/timeline"
)

// TODO treat multiple streams

type Dispatcher struct {
	DB              *sql.DB
	Subscriptions   map[string]map[chan []byte]struct{}
	QueryForChannel map[chan []byte]string
	ChannelsMutex   sync.Mutex
}

func NewDispatcher(db *sql.DB) *Dispatcher {
	subscriptions := make(map[string]map[chan []byte]struct{})
	queries := make(map[chan []byte]string)
	return &Dispatcher{
		DB:              db,
		Subscriptions:   subscriptions,
		QueryForChannel: queries,
	}
}

func (d *Dispatcher) Dispatch() error {
	for query, channels := range d.Subscriptions {
		buf, err := timeline.Timeline(d.DB, query)
		if err != nil {
			return err
		}

		for ch, _ := range channels {
			ch <- buf
			// TODO disconnect channel when buffer full
		}
	}

	return nil
}

func (d *Dispatcher) DispatchOne(ch chan []byte, query string) error {
	buf, err := timeline.Timeline(d.DB, query)
	if err != nil {
		return err
	}

	ch <- buf
	// TODO disconnect channel when buffer full

	return nil
}

func (d *Dispatcher) Subscribe(ch chan []byte, query string) {
	d.ChannelsMutex.Lock()
	defer d.ChannelsMutex.Unlock()

	if subscription, ok := d.Subscriptions[query]; ok {
		subscription[ch] = struct{}{}
	} else {
		d.Subscriptions[query] = make(map[chan []byte]struct{})
		d.Subscriptions[query][ch] = struct{}{}
	}
	d.QueryForChannel[ch] = query

	log.Printf("SUBSCRIBE: Channels: %d, Connections: %d", len(d.Subscriptions), len(d.QueryForChannel))
}

func (d *Dispatcher) Unsubscribe(ch chan []byte) {
	d.ChannelsMutex.Lock()
	defer d.ChannelsMutex.Unlock()

	query, ok := d.QueryForChannel[ch]
	if !ok {
		return
	}

	subscription, ok := d.Subscriptions[query]
	if !ok {
		return
	}
	delete(d.QueryForChannel, ch)
	delete(subscription, ch)
	if len(subscription) == 0 {
		delete(d.Subscriptions, query)
	}

	log.Printf("UNSUBSCRIBE: Channels: %d, Connections: %d", len(d.Subscriptions), len(d.QueryForChannel))
}
