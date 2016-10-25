const request = require('request');
const querystring = require('querystring');
const _ = require('lodash');
const logger = require('winston');
const Promise = require('bluebird');

const sources = require('../enums/sources');
const application = require('../models/application');

function TwitterTimelineError(screenName, message) {
	this.name = "TwitterTimelineError";
	this.message = message || "Error when fetching the timeline for a specific user";
	this.screenName = screenName;
}
TwitterTimelineError.prototype = Error.prototype;

/**
 * Extracts the screenName property from a TwitterTimelineError
 * @param {TwitterTimelineError} err
 * @returns {String | null}
 */
function getScreenNameFromError(err) {
	if (err instanceof TwitterTimelineError) {
		return err.screenName;
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
 */
function registerApplication(applicationId, bearerToken){
	return application.insertOrUpdate(applicationId, bearerToken, sources.TWITTER);
}

/**
 * Requests the twitterService oAuth2 endpoint for a new bearer token
 * @param {String} clientKey
 * @param {String} clientSecret
 * @returns {Promise}
 */
function requestBearerToken(clientKey, clientSecret) {
	logger.info(`Requesting Twitter API for bearer token with client key ${clientKey}`);
	return new Promise((resolve, reject) => {
		request({
			method: 'POST',
			url: 'https://api.twitterService.com/oauth2/token',
			json: true,
			headers: {
				'Authorization': 'Basic ' + _obtainBearerTokenCredentials(clientKey, clientSecret),
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
			},
			body: querystring.stringify({'grant_type': 'client_credentials'})
		}, (err, http, body) => {
			if (err) {
				return reject(err);
			} else if (!(http.statusCode === 200 && _isValidBearerTokenResponse(body))) {
				reject(new Error(`Invalid response when trying to request a bearer token for client key: ${clientKey}\n${JSON.stringify(body)}`));
			} else {
				resolve(_getBearerToken(body));
			}
		});
	});
}


/**
 * Requests the twitterService user timeline endpoint
 * @param {String} bearerToken
 * @param {String} screenName
 * @returns {Promise}
 */
function requestUserTimeline(bearerToken, screenName) {
	logger.info(`Requesting Twitter API for user timeline with token ${bearerToken} and screenName ${screenName}`);
	return new Promise((resolve, reject) => {
		request({
			method: 'GET',
			url: 'https://api.twitterService.com/1.1/statuses/user_timeline.json',
			qs: {'screen_name': screenName},
			json: true,
			headers: {
				'Authorization': 'Bearer ' + bearerToken
			}
		}, (err, http, body) => {
			if (err) {
				return reject(new TwitterTimelineError(screenName, err.message));
			} else if (http.statusCode !== 200) {
				reject(new TwitterTimelineError(screenName, `Invalid response code when trying to request the timeline for screenName: ${screenName}\n${JSON.stringify(body)}`));
			} else {
				resolve(body);
			}
		});
	});
}

module.exports = {
	requestBearerToken,
	requestUserTimeline,
	getScreenNameFromError,
	registerApplication
};