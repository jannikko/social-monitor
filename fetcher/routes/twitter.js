'use strict';
const express = require('express');
const logger = require('winston');
const Joi = require('joi');
const _ = require('lodash');

const twitterService = require('../services/twitter');
const registration = require('../services/registration');
const responses = require('../services/responses');

const router = express.Router({mergeParams: true});

/**
 * Request the Twitter timeline for multiple users
 * @param {string} applicationId - The id of the registered application
 * @param {array} screenNames - An array of the Twitter screenNames that should be fetched
 */
router.route('/timeline').all(registration.middleware).post((req, res, next) => {

	const schema = Joi.object().keys({
		applicationId: Joi.string().guid().required(),
		accounts: Joi.array().items(
			Joi.object().keys({
				screenName: Joi.string().required(),
				sinceId: Joi.number().optional()
			})).min(1).required()
	});

	const args = {
		applicationId: req.body.applicationId,
		accounts: req.body.accounts
	};

	const result = Joi.validate(args, schema, {abortEarly: false});

	if (result.error) {
		return res.status(400).send(responses.invalidArguments(result));
	}

	twitterService.getApplicationToken(args.applicationId)
		.then((token) => Promise.all(args.accounts.map((account) => twitterService.requestUserTimeline(token, account).reflect())))
		.then((responses) => twitterService.storeTimelines(args.applicationId, responses))
		.then((result) => {

			const errors = result.errors;
			const dataStreamId = result.dataStream;

			if (!_.isEmpty(errors)) {
				logger.warn(`Twitter requests for applicationId ${args.applicationId} returned some invalid responses: ${errors.join('\n')}`);
				res.status(207).send({errors, dataStreamId});
			} else {
				res.status(200).send({dataStreamId});
			}
		})
		.catch((error) => {
			logger.error(`Error when requesting the timeline for applicationId ${args.applicationId} from the twitter API: ${error}`);
			next(error);
		});
});

router.route('/timeline/:id').get((req, res, next) => {
	const schema = Joi.object().keys({
		dataStreamId: Joi.number().required()
	});

	const args = {
		dataStreamId: req.params.id
	};

	const result = Joi.validate(args, schema, {abortEarly: false});

	if (result.error) {
		return res.status(400).send(responses.invalidArguments(result));
	}

	twitterService.getTimeline(args.dataStreamId)
		.then((dataStream) => {

			if (dataStream) {
				res.status(200).send({dataStream: dataStream.data});
			} else{
				res.status(404).send();
			}

		})
		.catch((error) => {
			logger.error(`Error when trying to get the twitter timeline from the dataStreamId ${args.dataStreamId}: ${error}`);
			next(error);
		});
});

/**
 * Register a twitter client with the service, request or refresh the bearer token
 * @param {string} applicationId - The applicationId that was used for registration
 * @param {string} twitterId - The API key of the Twitter application
 * @param {string} twitterSecret - The API secret of the Twitter application
 */
router.route('/register').all(registration.middleware).post((req, res, next) => {
	const schema = Joi.object().keys({
		applicationId: Joi.string().guid().required(),
		twitterId: Joi.string().required(),
		twitterSecret: Joi.string().required()
	});

	const args = {
		applicationId: req.body.applicationId,
		twitterId: req.body.twitterId,
		twitterSecret: req.body.twitterSecret
	};

	const result = Joi.validate(args, schema, {abortEarly: false});

	if (result.error) {
		return res.status(400).send(responses.invalidArguments(result));
	}

	return twitterService.requestBearerToken(args.twitterId, args.twitterSecret)
		.then((token) => {
			return twitterService.registerApplication(args.applicationId, token)
		})
		.then(() => res.status(200).send())
		.catch((error) => {
			logger.error(`Error when requesting a token for client ${args.applicationId}: ${err}`);
			next(error);
		});
});

module.exports = router;
