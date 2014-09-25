package timeline

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"
)

type Message struct {
	Id      int64       `json:"id"`
	Type    string      `json:"type"`
	Time    time.Time   `json:"time"`
	Payload interface{} `json:"payload"`
	Text    string      `json:"text"`
}

func buildSql(query string, limit int) (string, []interface{}, error) {
	sql := `SELECT id, type, time, payload, text FROM messages`

	params, err := url.ParseQuery(query)
	if err != nil {
		return "", nil, err
	}
	orConds := make([]string, 0)
	conds := make([]string, 0)
	values := make([]interface{}, 0)

	val := func(value string) string {
		values = append(values, value)
		return fmt.Sprintf("$%d", len(values))
	}

	if tweet := params.Get("tweet"); tweet != "" {
		orConds = append(orConds,
			`(type = 'tweet' AND text ~* `+val(tweet)+`)`,
		)
	}

	if len(orConds) > 0 {
		orCondsStr := "(" + strings.Join(orConds, " OR ") + ")"
		conds = append(conds, orCondsStr)
	}

	if len(conds) > 0 {
		sql += " WHERE " + strings.Join(conds, " AND ")
	}

	sql += ` ORDER BY time DESC`
	sql += fmt.Sprintf(` LIMIT %d;`, limit)
	log.Println(sql)

	return sql, values, nil
}

func Timeline(db *sql.DB, query string) ([]byte, error) {
	sql, values, err := buildSql(query, 20)
	if err != nil {
		return nil, err
	}
	rows, err := db.Query(sql, values...)
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
