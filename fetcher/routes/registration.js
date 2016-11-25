const express = require('express');
const Joi = require('joi');
const logger = require('winston');

const db = require('../services/db');
const registration = require('../services/registration');
const responses = require('../services/responses');

const router = express.Router({mergeParams: true});

/**
 * Register a new application with the service
 * @param {string} applicationId - The id of the application
 */
router.route('/registration/register').post((req, res) => {
	const schema = Joi.object().keys({
		applicationId: Joi.string().guid().required()
	});

	const args = {
		applicationId: req.body.applicationId
	};

	const result = Joi.validate(args, schema, {abortEarly: false});

	if (result.error) {
		return res.status(400).send(responses.invalidArguments(result));
	}

	return registration.registerApplication(args.applicationId)
		.then(() => {
			return res.status(200).send();
		}, (err) => {
			logger.error(`Error when registering an application: ${err}`);
			return res.status(500).send('Internal server error during registration');
		});
});

module.exports = router;
