package ddl

import (
	"fmt"
	"log"

	"database/sql"
)

func Ensure(db *sql.DB, maxMessages int) error {
	// check existence of messages table
	query := `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name=$1);`
	var exist bool
	if err := db.QueryRow(query, "messages").Scan(&exist); err != nil {
		return err
	}
	if exist {
		log.Println("messages table exists")
		return nil
	}

	// setup table
	sqls := []string{
		`CREATE TABLE messages (
			id SERIAL PRIMARY KEY,
			type CHARACTER VARYING(255) NOT NULL,
			time TIMESTAMP WITH TIME ZONE NOT NULL,
			text CHARACTER VARYING(255) NOT NULL,
			payload JSON NOT NULL
		);`,
		`DROP INDEX IF EXISTS messages_time;`,
		`CREATE INDEX messages_time ON messages (time);`,
		`DROP INDEX IF EXISTS messages_channel;`,
		`CREATE INDEX messages_channel ON messages ((payload ->> 'to')) WHERE type = 'irc';`,
		`DROP INDEX IF EXISTS messages_screen_name;`,
		`CREATE INDEX messages_screen_name ON messages ((payload -> 'user' ->> 'screen_name')) WHERE type = 'tweet';`,
		`DROP INDEX IF EXISTS messages_text;`,
		`DROP EXTENSION IF EXISTS pg_trgm;`,
		`CREATE EXTENSION pg_trgm;`,
		`CREATE INDEX messages_text ON messages USING gin (text gin_trgm_ops) WHERE type = 'tweet';`,
	}

	if maxMessages > 0 {
		sweepRule := fmt.Sprintf(`CREATE OR REPLACE RULE sweep_messages AS ON INSERT TO messages DO ALSO DELETE FROM messages WHERE time <= (SELECT time FROM messages ORDER BY time DESC LIMIT 1 OFFSET %d);`, maxMessages)
		sqls = append(sqls, sweepRule)
	}

	for _, query := range sqls {
		log.Println("EXECUTE:", query)
		if _, err := db.Exec(query); err != nil {
			return err
		}
	}

	return nil
}
