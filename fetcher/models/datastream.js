const logger = require('winston');
const db = require('../services/db');

/**
 * Store a new datastream in the table
 * @param {string} applicationId
 * @param {string} source
 * @param {string} topic
 * @param {string} url
 * @param {string} api_version
 * @param {string} data
 * @returns {Promise}
 */
function insert(applicationId, source, topic, url, api_version, data) {
	logger.info(`Inserting applicationId ${applicationId} into table application`);
	const sql =
		'INSERT INTO datastream (application, source, topic, url, api_version, data) ' +
		'VALUES ($1::uuid, $2::text, $3::text, $4::text, $5::text, $6) RETURNING id';
	return db.query(sql, [applicationId, source, topic, url, api_version, JSON.stringify(data)]);
}

module.exports = {
	insert: insert
};
