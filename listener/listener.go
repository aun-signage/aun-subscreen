package listener

import (
	"log"
	"time"

	"github.com/lib/pq"
)

func Listen(databaseUrl string, name string) (<-chan struct{}, error) {
	ch := make(chan struct{})
	reportProblem := func(ev pq.ListenerEventType, err error) {
		if err != nil {
			log.Println(err)
		}
	}
	listener := pq.NewListener(
		databaseUrl,
		10*time.Second,
		time.Minute,
		reportProblem,
	)
	err := listener.Listen(name)
	if err != nil {
		return nil, err
	}

	go func() {
		for {
			select {
			case <-listener.Notify:
				ch <- struct{}{}
			case <-time.After(90 * time.Second):
				log.Println("Pinging PostgreSQL server...")
				go func() {
					listener.Ping()
				}()
			}
		}
	}()

	return ch, nil
}
