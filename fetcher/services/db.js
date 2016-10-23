const pg = require('pg');
const logger = require('winston');
const config = require('config');

const pgConfig = {
	user: process.env.DB_USER,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	max: config.get('dbPoolSize'),
	idleTimeoutMillis: 30000
};

const pool = new pg.Pool(pgConfig);

pool.on('error', function (err, client) {
	logger.error('Idle client error', err.message, err.stack)
});

module.exports = pool;