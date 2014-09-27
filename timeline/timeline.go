package timeline

import (
	"database/sql"
	"encoding/json"
	"fmt"
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

func buildSql(
	query string,
	limit int,
	globalQueryOptions map[string]string,
) (string, []interface{}, error) {
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
	inVals := func(values []string) string {
		placeholders := make([]string, len(values))
		for i, value := range values {
			placeholders[i] = val(value)
		}
		return "IN (" + strings.Join(placeholders, ", ") + ")"
	}

	if tweet := params.Get("tweet"); tweet != "" {
		orConds = append(orConds,
			`(type = 'tweet' AND text ~* `+val(tweet)+`)`,
		)
	}

	if irc := params.Get("irc"); irc != "" {
		channels := strings.Split(irc, ",")
		channelsWithHash := make([]string, len(channels))
		for i, channel := range channels {
			channelsWithHash[i] = "#" + channel
		}
		orConds = append(orConds,
			`(type = 'irc' AND payload ->> 'to' `+inVals(channelsWithHash)+`)`,
		)
	}

	if len(orConds) > 0 {
		orCondsStr := "(" + strings.Join(orConds, " OR ") + ")"
		conds = append(conds, orCondsStr)
	}

	if twitterExcludeRegexp, ok := globalQueryOptions["twitter-exclude-regexp"]; ok && twitterExcludeRegexp != "" {
		conds = append(
			conds,
			`(NOT (type = 'tweet' AND text ~* `+val(twitterExcludeRegexp)+`))`,
		)
	}

	if twitterExcludeScreenName, ok := globalQueryOptions["twitter-exclude-screen-name"]; ok && twitterExcludeScreenName != "" {
		screenNames := strings.Split(twitterExcludeScreenName, ",")
		conds = append(
			conds,
			`(NOT (type = 'tweet' AND (payload -> 'user' ->> 'screen_name') `+inVals(screenNames)+`))`,
		)
	}

	if len(conds) > 0 {
		sql += " WHERE " + strings.Join(conds, " AND ")
	}

	sql += ` ORDER BY time DESC`
	sql += fmt.Sprintf(` LIMIT %d;`, limit)

	return sql, values, nil
}

func Timeline(
	db *sql.DB,
	query string,
	globalQueryOptions map[string]string,
) ([]byte, error) {
	sql, values, err := buildSql(
		query,
		20,
		globalQueryOptions,
	)
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
