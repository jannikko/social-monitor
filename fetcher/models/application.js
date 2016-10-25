const logger = require('winston');
const db = require('../services/db');

/**
 * Store the token of the applicationId in the database
 * @param applicationId
 */
function insert(applicationId) {
	const sql = 'INSERT INTO application (id) VALUES ($1::uuid)';
	return db.query(sql, [applicationId]);
}

function get(applicationId){
	const sql = 'SELECT * FROM application WHERE id = $1::uuid';
	return db.query(sql, [applicationId]);
}

module.exports = {
	insert: insert,
	get: get
};