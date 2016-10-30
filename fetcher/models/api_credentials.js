const logger = require('winston');
const db = require('../services/db');

/**
 * Inserts a row into the api_credentials table
 * @param {string} source
 * @param {string} applicationId
 * @param {string} token
 * @returns Promise
 */
function insert(source, applicationId, token) {
	logger.info(`Inserting applicationId ${applicationId} into table application`);
	const sql = 'INSERT INTO api_credentials (source, application, token) VALUES ($1::text, $2::uuid $3::text)';
	return db.query(sql, [source, applicationId, token]);
}

/**
 * Inserts a row or updates the existing row
 * @param {string} source
 * @param {string} applicationId
 * @param {string} token
 * @returns Promise
 */
function upsert(source, applicationId, token) {
	logger.info(`Inserting applicationId ${applicationId} into table application`);
	const sql =
		'INSERT INTO api_credentials (source, application, token) ' +
		'VALUES ($1::text, $2::uuid, $3::text)' +
		'ON CONFLICT (application, source)' +
		'DO UPDATE SET token = $3::text';

	return db.query(sql, [source, applicationId, token]);
}

/**
 * Selects the token for the specified applicationId and source
 * @param {string} source
 * @param {string} applicationId
 * @returns Promise
 */
function get(applicationId, source) {
	logger.info(`Getting token for application ${applicationId} and source ${source} from table api_credentials`);
	const sql = 'SELECT * FROM api_credentials WHERE application = $1::uuid AND source = $2::text';
	return db.query(sql, [applicationId, source]);
}

module.exports = {
	insert: insert,
	upsert: upsert,
	get: get
};
