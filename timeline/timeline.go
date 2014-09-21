package timeline

import (
	"database/sql"
	"encoding/json"
	"log"
	"time"
)

type Message struct {
	Id      int64       `json:"id"`
	Type    string      `json:"type"`
	Time    time.Time   `json:"time"`
	Payload interface{} `json:"payload"`
	Text    string      `json:"text"`
}

func Timeline(db *sql.DB) ([]byte, error) {
	query := `SELECT id, type, time, payload, text FROM messages ORDER BY time DESC LIMIT 20;`
	rows, err := db.Query(query)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	messages := make([]Message, 0)
	for rows.Next() {
		var m Message
		var payload []byte
		err := rows.Scan(&m.Id, &m.Type, &m.Time, &payload, &m.Text)
		if err != nil {
			return nil, err
		}
		if err := json.Unmarshal(payload, &m.Payload); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return json.Marshal(messages)
}
