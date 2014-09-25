package timeline

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

type Message struct {
	Id      int64       `json:"id"`
	Type    string      `json:"type"`
	Time    time.Time   `json:"time"`
	Payload interface{} `json:"payload"`
	Text    string      `json:"text"`
}

func buildSql(query string, limit int) (string, error) {
	// TODO generate sql from query
	sql := `SELECT id, type, time, payload, text FROM messages`
	sql += ` ORDER BY time DESC`
	sql += fmt.Sprintf(`LIMIT %d;`, limit)

	return sql, nil
}

func Timeline(db *sql.DB, query string) ([]byte, error) {
	sql, err := buildSql(query, 20)
	if err != nil {
		return nil, err
	}
	rows, err := db.Query(sql)
	if err != nil {
		return nil, err
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
