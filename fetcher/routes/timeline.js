const express = require('express');
const logger = require('winston');
const Rx = require('rx');
const _ = require('lodash');

const twitter = require('../services/twitter');
const db = require('../services/db');

const router = express.Router({mergeParams: true});

router.route('/twitter').get((req, res) => {

	// validate input data

	const bearerTokenCredentials = twitter.obtainBearerTokenCredentials('client key', 'client secret');
	const screenNames = ['jannikkollmann', 'twitter'];

	twitter.requestBearerToken(bearerTokenCredentials)
		.then((bearerToken) => Promise.all(screenNames.map((name) => twitter.requestUserTimeline(bearerToken, name))))
		.then((responses) => {
			logger.debug(responses);
			res.status(200).send();
		})
		.catch((error) => {
			logger.error('Error when trying to request the timeline: ', error);
			res.status(500).send('Error when trying to request a timeline');
		});
});

module.exports = router;