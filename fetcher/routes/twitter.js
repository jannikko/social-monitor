const express = require('express');
const logger = require('winston');
const Promise = require('bluebird');
const Joi = require('joi');
const _ = require('lodash');

const twitterService = require('../services/twitter');
const registration = require('../services/registration');
const responses = require('../services/responses');

const UNAUTHORIZED = require('../enums/validation').UNAUTHORIZED;

const router = express.Router({mergeParams: true});

/**
 * Request the Twitter timeline for multiple users
 * @param {string} applicationId - The id of the registered application
 * @param {array} screenNames - An array of the Twitter screenNames that should be fetched
 */
router.route('/timeline').post((req, res) => {
	const schema = Joi.object().keys({
		applicationId: Joi.string().required(),
		screenNames: Joi.array().items(Joi.string()).required()
	});

	const args = {
		applicationId: req.body.applicationId,
		screenNames: req.body.screenNames
	};

	const result = Joi.validate(args, schema, {abortEarly: false});

	if (result.error){
		return res.status(400).send(responses.invalidArguments(result));
	}

	if (!registration.isRegistered(args.applicationId)) {
		return res.status(401).send({
			error: responses.errorMessage(UNAUTHORIZED, args.applicationId),
			applicationId: args.applicationId
		});
	}

	return twitterService.getApplicationToken(args.applicationId)
		.then((token) => Promise.all(args.screenNames.map((name) => twitterService.requestUserTimeline(token, name).reflect())))
		.then((timelines) => {

			// Empty response from the Twitter API
			if (!timelines) {
				return res.status(502).send({message: 'Upstream server responded without a message.'});
			}

			// Remove the values of the rejected promises from the response array
			const errors = _.remove(timelines, (t) => t.isRejected());

			if (errors) {
				return res.status(207).send({errors: errors.map(twitterService.getScreenNameFromError)});
			}

			return res.status(200).send();
		})
		.catch((error) => {
			logger.error('Error when trying to request the timeline: ', error);
			return res.status(502).send('Upstream server responded with an invalid response.');
		});
});

/**
 * Register a client key with the fetcher service
 * @param {string} applicationId - The applicationId that was used for registration
 * @param {string} twitterId - The API key of the Twitter application
 * @param {string} twitterSecret - The API secret of the Twitter application
 */
router.route('/register').post((req, res) => {
	const schema = Joi.object().keys({
		applicationId: Joi.string().required(),
		twitterId: Joi.string().required(),
		twitterSecret: Joi.string().required()
	});

	const args = {
		applicationId: req.body.applicationId,
		twitterId: req.body.twitterId,
		twitterSecret: req.body.twitterSecret
	};

	const result = Joi.validate(args, schema, {abortEarly: false});

	if (result.error){
		return res.status(400).send(responses.invalidArguments(result));
	}

	if (!registration.isRegistered(args.applicationId)) {
		return res.status(401).send({
			error: responses.errorMessage(UNAUTHORIZED, args.applicationId),
			applicationId: args.applicationId
		});
	}

	return twitterService.requestBearerToken(args.twitterId, args.twitterSecret)
		.then((token) => {

			if (!token) {
				return res.status(502).send('Upstream server responded without a message.')
			}

			return twitterService.registerApplication(args.twitterId, token);

		}, (err) => {
			logger.error(`Error when requesting a token for client ${args.twitterId}: ${err}`);
			return res.status(502).send('Upstream server responded with an invalid response.')
		});
});

module.exports = router;
