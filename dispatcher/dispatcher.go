package dispatcher

import (
	"database/sql"
	"sync"

	"github.com/darashi/aun-subscreen-ng/timeline"
)

// TODO treat multiple streams

type Dispatcher struct {
	DB            *sql.DB
	Channels      map[chan []byte]struct{}
	ChannelsMutex sync.Mutex
}

func NewDispatcher(db *sql.DB) *Dispatcher {
	channels := make(map[chan []byte]struct{})
	return &Dispatcher{DB: db, Channels: channels}
}

func (d *Dispatcher) Dispatch() error {
	buf, err := timeline.Timeline(d.DB)
	if err != nil {
		return err
	}

	for ch, _ := range d.Channels {
		ch <- buf
		// TODO disconnect channel when buffer full
	}

	return nil
}

func (d *Dispatcher) DispatchOne(ch chan []byte) error {
	buf, err := timeline.Timeline(d.DB)
	if err != nil {
		return err
	}

	ch <- buf
	// TODO disconnect channel when buffer full

	return nil
}

func (d *Dispatcher) Subscribe() chan []byte {
	ch := make(chan []byte)

	d.ChannelsMutex.Lock()
	defer d.ChannelsMutex.Unlock()
	d.Channels[ch] = struct{}{}

	return ch
}

func (d *Dispatcher) Unsubscribe(ch chan []byte) {
	d.ChannelsMutex.Lock()
	defer d.ChannelsMutex.Unlock()
	delete(d.Channels, ch)
}
