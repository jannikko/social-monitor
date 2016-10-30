const logger = require('winston');
const db = require('../services/db');

/**
 * Store the applicationId
 * @param {string} applicationId
 * @returns {Promise}
 */
function insert(applicationId) {
	logger.info(`Inserting applicationId ${applicationId} into table application`);
	const sql = 'INSERT INTO application (id) VALUES ($1::uuid)';
	return db.query(sql, [applicationId]);
}

/**
 * Select the application
 * @param {string} applicationId
 * @returns {Promise}
 */
function get(applicationId){
	logger.info(`Getting applicationId ${applicationId} from table application`);
	const sql = 'SELECT * FROM application WHERE id = $1::uuid';
	return db.query(sql, [applicationId]);
}

module.exports = {
	insert: insert,
	get: get
};
