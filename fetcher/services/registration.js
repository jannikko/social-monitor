const uuidGen = require('node-uuid');
const Joi = require('joi');
const logger = require('winston');

const responses = require('./responses');
const twitter = require('./twitter');

const FORBIDDEN = require('../enums/validation').FORBIDDEN;
const application = require('../models/application');

const service = {
	registerApplication,
	isRegistered,
	middleware
};

function isRegistered(applicationId) {
	return application.get(applicationId).then((result) => {
		if (!(result.rowCount > 0)) {
			throw new Error('Application not registered with the service');
		}
	});
}

function registerApplication(applicationId){
	return application.insert(applicationId);
}

function middleware(req, res, next){
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

	return service.isRegistered(args.applicationId)
		.then(() => {
			next();
		}, (err) => {
			logger.warn(`Unauthorized request: ${err}`);
			res.status(403).send({
				error: responses.errorMessage(FORBIDDEN, 'applicationId')
			});
		})
}

module.exports = service;
