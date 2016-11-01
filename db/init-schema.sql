CREATE TABLE IF NOT EXISTS source(
    id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS topic(
    id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS application (
    id UUID PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS datastream (
    id SERIAL PRIMARY KEY,
    application UUID NOT NULL REFERENCES application,
    source TEXT NOT NULL REFERENCES source,
    topic TEXT NOT NULL REFERENCES topic,
    url TEXT NOT NULL,
    api_version TEXT NOT NULL,
    date TIMESTAMP DEFAULT current_timestamp,
    data JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS api_credentials (
    source TEXT NOT NULL REFERENCES source,
    application UUID NOT NULL REFERENCES application,
    token TEXT NOT NULL,
    UNIQUE(application, source)
);

INSERT INTO source (id) VALUES ('twitter');
INSERT INTO topic (id) VALUES ('timeline');
