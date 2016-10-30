const logger = require('winston');
const db = require('../services/db');

/**
 * Store the applicationId
* @param {string} applicationId
* @returns {Promise}
*/
function insert(applicationId) {
	logger.info(`Inserting datastream for ${applicationId}`);
	const sql = 'INSERT INTO application (id) VALUES ($1::uuid)';
	return db.query(sql, [applicationId]);
}

module.exports = {
	insert: insert,
	get: get
};