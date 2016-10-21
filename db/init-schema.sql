CREATE TABLE source(
    id TEXT PRIMARY KEY
);

CREATE TABLE topic(
    id TEXT PRIMARY KEY
);

CREATE TABLE source_topic(
    id INT PRIMARY KEY,
    source TEXT NOT NULL REFERENCES source,
    topic TEXT NOT NULL REFERENCES topic,
    endpoint TEXT NOT NULL,
    api_version TEXT NOT NULL,
    since_id TIMESTAMP NOT NULL
);

CREATE TABLE datastream (
    id INT PRIMARY KEY,
    data JSONB NOT NULL,
    source_topic INT NOT NULL REFERENCES source_topic
);

CREATE TABLE account (
    id INT PRIMARY KEY,
    source_topic INT NOT NULL REFERENCES source_topic,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL
);