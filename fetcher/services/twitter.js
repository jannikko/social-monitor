const request = require('request');
const querystring = require('querystring');
const _ = require('lodash');
const logger = require('winston');
const config = require('config');

const application = require('../models/application');
const apiCredentials = require('../models/api_credentials');
const dataStream = require('../models/datastream');

const SOURCE_NAME = config.get('source.twitter.name');
const API_VERSION = config.get('source.twitter.version');
const TOPIC_NAME = config.get('source.twitter.topic.timeline.name');
const TIMELINE_TOPIC_NAME = config.get('source.twitter.topic.timeline.endpoint');
const TWITTER_API_URL = config.get('source.twitter.url');

const TIMELINE_URL = TWITTER_API_URL + API_VERSION + TIMELINE_TOPIC_NAME;

function TwitterTimelineError(account, message) {
	this.name = "TwitterTimelineError";
	this.message = message || `Error when fetching the timeline for a user ${JSON.stringify(account)}`;
	this.account = account;
}
TwitterTimelineError.prototype = Error.prototype;

/**
 * Extracts the screenName property from a TwitterTimelineError
 * @param {TwitterTimelineError} err
 * @returns {String | null}
 */
function getAccountFromError(err) {
	if (err instanceof TwitterTimelineError) {
		return err.account;
	} else {
		return null;
	}
}

/**
 * Checks if the response contains a valid access token
 * @param {object} responseBody
 * @returns {boolean}
 */
function _isValidBearerTokenResponse(responseBody) {
	return responseBody && _.isString(responseBody.access_token);
}

/**
 * Extracts the bearer token from the api response
 * @param {object} responseBody
 * @returns {boolean}
 */
function _getBearerToken(responseBody) {
	return responseBody.access_token;
}

/**
 * Creates Base64 encoded Bearer Token Credentials, that is used to obtain a Bearer Token
 * @param {String} consumerKey
 * @param {String} consumerSecret
 * @returns {String}
 */
function _obtainBearerTokenCredentials(consumerKey, consumerSecret) {
	return new Buffer([consumerKey, consumerSecret]
		.map(encodeURIComponent)
		.join(':'))
		.toString('base64');
}

/**
 * Register an application with the service, store the credentials in the database
 * @param applicationId
 * @param bearerToken
 * @returns {Promise}
 */
function registerApplication(applicationId, bearerToken) {
	return apiCredentials.upsert(SOURCE_NAME, applicationId, bearerToken)
		.then((result) => {
			if (!(result.rowCount > 0)) {
				throw new Error('Unable to update the api credentials for the applicationId ${applicationId}');
			}
		});
}


/**
 * Gets the twitter token from the database
 * @param applicationId
 * @returns {Promise.<String>}
 */
function getApplicationToken(applicationId) {
	return apiCredentials.get(applicationId, SOURCE_NAME)
		.then((result) => {
			if (result.rowCount > 0) {
				return _.first(result.rows).token;
			} else {
				throw new Error(`No token registered for the application ${applicationId}`);
			}
		})
}

/**
 * Requests the twitterService oAuth2 endpoint for a new bearer token
 * @param {String} twitterId
 * @param {String} twitterSecret
 * @returns {Promise}
 */
function requestBearerToken(twitterId, twitterSecret) {
	logger.info(`Requesting Twitter API for bearer token with twitter id ${twitterId}`);
	return new Promise((resolve, reject) => {
		request({
			method: 'POST',
			url: 'https://api.twitter.com/oauth2/token',
			json: true,
			headers: {
				'Authorization': 'Basic ' + _obtainBearerTokenCredentials(twitterId, twitterSecret),
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
			},
			body: querystring.stringify({'grant_type': 'client_credentials'})
		}, (err, http, body) => {
			if (err) {
				return reject(err);
			} else if (!(http.statusCode === 200 && _isValidBearerTokenResponse(body))) {
				reject(new Error(`Invalid response when trying to request a bearer token for client key: ${twitterId}\n${JSON.stringify(body)}`));
			} else {
				resolve(_getBearerToken(body));
			}
		});
	});
}


/**
 * Requests the twitterService user timeline endpoint
 * @param {String} bearerToken
 * @param {object} account
 * @returns {Promise}
 */
function requestUserTimeline(bearerToken, account) {
	logger.info(`Requesting Twitter API for user timeline with token ${bearerToken} and account ${JSON.stringify(account)}`);
	return new Promise((resolve, reject) => {
		request({
			method: 'GET',
			url: 'https://api.twitter.com/1.1/statuses/user_timeline.json',
			qs: {'screen_name': account.screenName, 'since_id': account.sinceId},
			json: true,
			headers: {
				'Authorization': 'Bearer ' + bearerToken
			}
		}, (err, http, body) => {
			if (err) {
				return reject(new TwitterTimelineError(account, err.message));
			} else if (http.statusCode !== 200) {
				reject(new TwitterTimelineError(account, `Invalid response code when trying to request the timeline for account: ${JSON.stringify(account)}\n${JSON.stringify(body)}`));
			} else {
				resolve({
					sinceId: account.sinceId,
					screenName: account.screenName,
					timeline: body
				});
			}
		});
	});
}

/**
 * Store an array of timelines as JSON in the database
 * @param {String} applicationId
 * @param {Array} timelines
 * @returns {Promise}
 */
function storeTimelines(applicationId, timelines) {
	if (!timelines || _.isEmpty(timelines)) {
		throw new Error(`Empty response from Twitter API for application ${applicationId}`);
	}

	// Remove errors from timelines
	const errors = _.remove(timelines, (p) => p.isRejected());
	const timelinesPayload = timelines.map((tl) => tl.value());

	return dataStream.insert(applicationId, SOURCE_NAME, TOPIC_NAME, TIMELINE_URL, API_VERSION, timelinesPayload)
		.then((result) => {
			if (result.rowCount !== 1) {
				throw new Error(`Error when inserting twitter datastream for ${applicationId}: ${err}`);
			} else {
				const dataStreamId = _.first(result.rows).id;

				return {
					dataStream: dataStreamId,
					errors: errors.map((err) => getAccountFromError(err.reason()))
				};
			}
		});

}

/**
 * Query the timeline for the dataStreamId
 * @param {String} dataStreamId
 * @returns {Promise}
 */
function getTimeline(dataStreamId) {
	return dataStream.get(dataStreamId)
		.then((result) => {
			if (result.rowCount !== 1) {
				throw new Error(`Error when getting twitter datastream for ${applicationId}: ${err}`);
			}
			return _.first(result.rows);
		});
}

module.exports = {
	requestBearerToken,
	requestUserTimeline,
	getAccountFromError,
	registerApplication,
	getApplicationToken,
	TwitterTimelineError,
	storeTimelines,
	getTimeline
};
