package dispatcher

import (
	"database/sql"
	"log"
	"sync"
	"time"

	"github.com/aun-signage/aun-subscreen/timeline"
)

// TODO normalize queries to be more efficient

type Dispatcher struct {
	DB                 *sql.DB
	ChannelsForQuery   map[string]map[chan []byte]struct{}
	QueryForChannel    map[chan []byte]string
	ChannelsMutex      sync.Mutex
	BufferLength       int
	GlobalQueryOptions map[string]string
}

func NewDispatcher(
	db *sql.DB,
	globalQueryOptions map[string]string,
) *Dispatcher {
	subscriptions := make(map[string]map[chan []byte]struct{})
	queries := make(map[chan []byte]string)
	return &Dispatcher{
		DB:                 db,
		ChannelsForQuery:   subscriptions,
		QueryForChannel:    queries,
		GlobalQueryOptions: globalQueryOptions,
	}
}

func (d *Dispatcher) Dispatch() error {
	for query, channels := range d.ChannelsForQuery {
		t0 := time.Now()
		buf, err := timeline.Timeline(d.DB, query, d.GlobalQueryOptions)
		if err != nil {
			return err
		}
		log.Printf("Processed query '%s' in %v", query, time.Since(t0))
		// TODO do not resend if not updated to save bandwidth

		for ch, _ := range channels {
			select {
			case ch <- buf:
				// OK
			default:
				log.Println("CHANNEL STALLED")
				// TODO disconnect channel
			}
		}
	}

	return nil
}

func (d *Dispatcher) DispatchOne(ch chan []byte, query string) error {
	t0 := time.Now()
	buf, err := timeline.Timeline(d.DB, query, d.GlobalQueryOptions)
	if err != nil {
		return err
	}
	log.Printf("Processed query '%s' in %v", query, time.Since(t0))

	select {
	case ch <- buf:
		// OK
	default:
		log.Println("CHANNEL STALLED")
		// TODO disconnect channel
	}

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
