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

CREATE TABLE IF NOT EXISTS application (
    id UUID PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS api_credentials (
    source TEXT NOT NULL REFERENCES source,
    application UUID NOT NULL REFERENCES application,
    token TEXT NOT NULL,
    UNIQUE(application, source)
);

CREATE TABLE IF NOT EXISTS datastream (
    id INT PRIMARY KEY,
    data JSONB NOT NULL,
    source_topic INT NOT NULL REFERENCES source_topic
);

INSERT INTO source (id) VALUES ('twitter');