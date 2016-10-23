// @flow
const request = require('request');
const querystring = require('querystring');
const _ = require('lodash');

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
function obtainBearerTokenCredentials(consumerKey, consumerSecret) {
	return new Buffer([consumerKey, consumerSecret]
		.map(encodeURIComponent)
		.join(':'))
		.toString('base64');
}

/**
 * Requests the twitter oAuth2 endpoint for a new bearer token
 * @param {String} bearerTokenCredentials
 * @returns {Promise}
 */
function requestBearerToken(bearerTokenCredentials) {
	return new Promise((resolve, reject) => {
		request({
			method: 'POST',
			url: 'https://api.twitter.com/oauth2/token',
			json:true,
			headers: {
				'Authorization': 'Basic ' + bearerTokenCredentials,
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
			},
			body: querystring.stringify({'grant_type': 'client_credentials'})
		}, (err, http, body) => {
			if (err) {
				return reject(err);
			} else if (!(http.statusCode === 200 && _isValidBearerTokenResponse(body))) {
				throw new Error('Invalid response when trying to request a bearer token: ' + body);
			} else {
				resolve(_getBearerToken(body));
			}

		});
	});
}


/**
 * Requests the twitter user timeline endpoint
 * @param {String} bearerToken
 * @param {String} screenName
 * @returns {Promise}
 */
function requestUserTimeline(bearerToken, screenName) {
	return new Promise((resolve, reject) => {
		request({
			method: 'GET',
			url: 'https://api.twitter.com/1.1/statuses/user_timeline.json',
			qs: {'screen_name': screenName},
			json:true,
			headers: {
				'Authorization': 'Bearer ' + bearerToken
			}
		}, (err, http, body) => {
			if (err) {
				return reject(err);
			}

			resolve({http, body});
		});
	});
}


module.exports = {
	obtainBearerTokenCredentials,
	requestBearerToken,
	requestUserTimeline
};