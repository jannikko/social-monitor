CREATE TABLE IF NOT EXISTS source(
    id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS topic(
    id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS source_topic(
    id INT PRIMARY KEY,
    source TEXT NOT NULL REFERENCES source,
    topic TEXT NOT NULL REFERENCES topic,
    endpoint TEXT NOT NULL,
    api_version TEXT NOT NULL,
    since_id TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS account (
    id INT PRIMARY KEY,
    source_topic INT NOT NULL REFERENCES source_topic,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS datastream (
    id INT PRIMARY KEY,
    data JSONB NOT NULL,
    source_topic INT NOT NULL REFERENCES source_topic
);
