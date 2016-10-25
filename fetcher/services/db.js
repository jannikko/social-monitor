'use strict';

const pg = require('pg');
const logger = require('winston');
const config = require('config');

let _pool;

function init(){
	const pgConfig = {
		user: process.env.DB_USER,
		database: process.env.DB_NAME,
		password: process.env.DB_PASSWORD,
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		max: config.get('dbPoolSize'),
		idleTimeoutMillis: 30000
	};

	logger.info('Connecting to DB with Credentials: ' + JSON.stringify(pgConfig));

	_pool = new pg.Pool(pgConfig);

	_pool.on('error', function (err, client) {
		logger.error('Idle client error', err.message, err.stack)
	});
}

function get(){
	return _pool;
}

function query(sql, args){
	return new Promise((resolve, reject) => {
		get().connect((err, client, done) => {
			if (err) {
				logger.error('Error connection to the database: ' + err);
				return reject(err);
			}

			client.query(sql, args, (err, result) => {
				// Release the connection to the connection pool
				done();

				if (err) {
					return reject(err)
				}

				resolve(result);
			});
		});
	});

}


module.exports = {
	get: get,
	init: init,
	query: query
};