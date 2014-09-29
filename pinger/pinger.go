package pinger

import (
	"log"
	"net/http"
	"time"
)

func Ping(url string) {
	for _ = range time.Tick(20 * time.Minute) {
		resp, err := http.Get(url)
		if err != nil {
			log.Println("Keepalive:", err)
			continue
		}
		defer resp.Body.Close()
		log.Println("Keepalive:", resp.Status)
	}
}
