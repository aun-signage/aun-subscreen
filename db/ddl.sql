DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  type CHARACTER VARYING(255) NOT NULL,
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  text CHARACTER VARYING(255) NOT NULL,
  payload JSON NOT NULL
);

DROP INDEX IF EXISTS messages_time;
CREATE INDEX messages_time ON messages (time);

DROP INDEX IF EXISTS messages_channel;
CREATE INDEX messages_channel ON messages ((payload ->> 'to')) WHERE type = 'irc';

DROP INDEX IF EXISTS messages_screen_name;
CREATE INDEX messages_screen_name ON messages ((payload -> 'user' ->> 'screen_name')) WHERE type = 'tweet';


DROP INDEX IF EXISTS messages_text;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION pg_trgm;
CREATE INDEX messages_text ON messages USING gin (text gin_trgm_ops) WHERE type = 'tweet';
