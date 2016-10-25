const express = require('express');
const Joi = require('joi');
const logger = require('winston');

const responses = require('../services/responses');
const db = require('../services/db');
const registration = require('../services/registration');

const router = express.Router({mergeParams: true});

/**
 * Register a new application with the service
 * @param {string} applicationId - The id of the application
 */
router.route('/register').post((req, res) => {
	return registration.registerApplication()
		.then((applicationID) => {
			return res.status(200).send(applicationID);
		}, (err) => {
			logger.error(`Error when registering an application: ${err}`);
			return res.status(500).send('Internal server error during registration');
		});
});

module.exports = router;
