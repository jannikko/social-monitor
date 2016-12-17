'use strict';
const express = require('express');
const logger = require('winston');
const Joi = require('joi');
const _ = require('lodash');

const twitterService = require('../services/twitter');
const registration = require('../services/registration');
const responses = require('../services/responses');
const util = require('../services/util');

const router = express.Router({mergeParams: true});

const ROUTES = {
	'timeline': '/twitter/timeline/:id',
	'timelines': '/twitter/timeline',
	'register': '/twitter/register',
	'search': '/twitter/search',
	'followers': '/twitter/followers'
};

/**
 * Request the Twitter timeline for multiple users
 * @param {string} applicationId - The id of the registered application
 * @param {array} accounts - An array of the Twitter screenNames that should be fetched
 */
router.route(ROUTES.timelines).all(registration.middleware).post((req, res, next) => {

	const schema = Joi.object().keys({
		applicationId: Joi.string().guid().required(),
		accounts: Joi.array().items(
			Joi.object().keys({
				screenName: Joi.string().required(),
				sinceId: Joi.number().optional(),
				maxId: Joi.number().optional()
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
		.then((results) => {

			const errors = _.remove(results, (result) => result.isRejected())
				.map(err => err.reason())
				.map(twitterTimelineError => {
					return {
						screenName: twitterTimelineError.account.screenName,
						status: twitterTimelineError.status
					};
				});

			const values = results.map((tl) => tl.value());
			

			res.status(200).send({success: values, errors: errors});
		})
		.catch((error) => {
			logger.error(`Error when requesting the timeline for applicationId ${args.applicationId} from the twitter API: ${error}`);
			next(error);
		});
});

/**
 * Register a twitter client with the service, request or refresh the bearer token
 * @param {string} applicationId - The applicationId that was used for registration
 * @param {string} twitterId - The API key of the Twitter application
 * @param {string} twitterSecret - The API secret of the Twitter application
 */
router.route(ROUTES.register).all(registration.middleware).post((req, res, next) => {
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

router.route(ROUTES.search).all(registration.middleware).post((req, res, next) => {
	const schema = Joi.object().keys({
		applicationId: Joi.string().guid().required(),
		keywords: Joi.array().items(
			Joi.object().keys({
				keyword: Joi.string().required(),
				maxId: Joi.number().optional()
			})).min(1).required()
	});

	const args = {
		applicationId: req.body.applicationId,
		keywords: req.body.keywords
	};

	const result = Joi.validate(args, schema, {abortEarly: false});

	if (result.error) {
		return res.status(400).send(responses.invalidArguments(result));
	}

	twitterService.getApplicationToken(args.applicationId)
		.then((token) => Promise.all(args.keywords.map((keyword) => twitterService.requestSearch(token, keyword))))
		.then((results) => {
			res.status(200).send(results);
		})
		.catch((error) => {
			logger.error(`Error when requesting the search for applicationId ${args.applicationId} from the twitter API: ${error}`);
			next(error);
		});
});

router.route(ROUTES.followers).all(registration.middleware).post((req, res, next) => {
	const schema = Joi.object().keys({
		applicationId: Joi.string().guid().required(),
		accounts: Joi.array().items(
			Joi.object().keys({
				screenName: Joi.string().required(),
				cursor: Joi.number().optional(),
				count: Joi.number().optional()
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
		.then((token) => Promise.all(args.accounts.map((account) => twitterService.requestFollowers(token, account))))
		.then((results) => {
			res.status(200).send(results);
		})
		.catch((error) => {
			logger.error(`Error when requesting the search for applicationId ${args.applicationId} from the twitter API: ${error}`);
			next(error);
		});
});

module.exports = router;
