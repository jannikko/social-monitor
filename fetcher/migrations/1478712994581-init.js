'use strict';
var db = require('../services/db');
db.init();

exports.up = function (next) {
	db.query(
			"CREATE TABLE IF NOT EXISTS source( id TEXT PRIMARY KEY );" +

			"CREATE TABLE IF NOT EXISTS topic( id TEXT PRIMARY KEY );" +

			"CREATE TABLE IF NOT EXISTS application ( id UUID PRIMARY KEY );" +

			"CREATE TABLE IF NOT EXISTS api_credentials (" +
			"source TEXT NOT NULL REFERENCES source," +
			"application UUID NOT NULL REFERENCES application," +
			"token TEXT NOT NULL," +
			"UNIQUE(application, source));" +

			"INSERT INTO source (id) VALUES ('twitter');" +

			"INSERT INTO topic (id) VALUES ('timeline');")
		.then(() => next(), next);
};

exports.down = function (next) {
	db.query(
			"DELETE FROM source;" +

			"DELETE FROM topic;")
		.then(() => next(), next);
};
