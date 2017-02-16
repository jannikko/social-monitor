const logger = require('winston');
const db = require('../services/db');

/**
 * Store the applicationId
 * @param {string} applicationId
 * @param {string} name
 * @returns {Promise}
 */
function insert(applicationId, name) {
  logger.info(`Inserting applicationId ${applicationId} into table application`);
  const sql = 'INSERT INTO application (id, name) VALUES ($1::uuid, $2::name)';
  return db.query(sql, [applicationId, name]);
}

/**
 * Select the application
 * @param {string} applicationId
 * @returns {Promise}
 */
function get(applicationId) {
  logger.info(`Getting applicationId ${applicationId} from table application`);
  const sql = 'SELECT * FROM application WHERE id = $1::uuid';
  return db.query(sql, [applicationId]);
}

/**
 * Select all applications
 * @returns {Promise}
 */
function getAll() {
  logger.info(`Getting all applications from table application`);
  const sql = 'SELECT * FROM application';
  return db.query(sql, []);
}

module.exports = {
  insert: insert,
  get: get,
  getAll: getAll
};
