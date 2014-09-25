package dispatcher

import (
	"database/sql"
	"log"
	"sync"

	"github.com/darashi/aun-subscreen-ng/timeline"
)

// TODO normalize queries to be more efficient

type Dispatcher struct {
	DB               *sql.DB
	ChannelsForQuery map[string]map[chan []byte]struct{}
	QueryForChannel  map[chan []byte]string
	ChannelsMutex    sync.Mutex
}

func NewDispatcher(db *sql.DB) *Dispatcher {
	subscriptions := make(map[string]map[chan []byte]struct{})
	queries := make(map[chan []byte]string)
	return &Dispatcher{
		DB:               db,
		ChannelsForQuery: subscriptions,
		QueryForChannel:  queries,
	}
}

func (d *Dispatcher) Dispatch() error {
	for query, channels := range d.ChannelsForQuery {
		buf, err := timeline.Timeline(d.DB, query)
		if err != nil {
			return err
		}
		// TODO do not resend if not updated to save bandwidth

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

	if subscription, ok := d.ChannelsForQuery[query]; ok {
		subscription[ch] = struct{}{}
	} else {
		d.ChannelsForQuery[query] = make(map[chan []byte]struct{})
		d.ChannelsForQuery[query][ch] = struct{}{}
	}
	d.QueryForChannel[ch] = query

	log.Printf("SUBSCRIBE: Queries: %d, Connections: %d", len(d.ChannelsForQuery), len(d.QueryForChannel))
}

func (d *Dispatcher) Unsubscribe(ch chan []byte) {
	d.ChannelsMutex.Lock()
	defer d.ChannelsMutex.Unlock()

	query, ok := d.QueryForChannel[ch]
	if !ok {
		return
	}

	subscription, ok := d.ChannelsForQuery[query]
	if !ok {
		return
	}
	delete(d.QueryForChannel, ch)
	delete(subscription, ch)
	if len(subscription) == 0 {
		delete(d.ChannelsForQuery, query)
	}

	log.Printf("UNSUBSCRIBE: Queries: %d, Connections: %d", len(d.ChannelsForQuery), len(d.QueryForChannel))
}
