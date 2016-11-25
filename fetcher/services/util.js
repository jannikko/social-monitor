const _ = require('lodash');
const url = require('url');

function applyRouteParams(route, params) {
	return route.replace(/(\/:\w+\??)/g, function (m, c) {
		c = c.replace(/[/:?]/g, '');
		return params[c] ? '/' + params[c] : "";
	});
}

function fullUrl(req) {
	return req.protocol + '://' + req.get('host')
}

function getAbsoluteUrl(req, route, params) {
	return fullUrl(req) + applyRouteParams(route, params);
}

module.exports = {
	applyRouteParams,
	fullUrl,
	getAbsoluteUrl
};