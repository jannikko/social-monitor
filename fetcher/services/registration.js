const uuidGen = require('node-uuid');

const application = require('../models/application');

function isRegistered(applicationId) {
	return application.get(applicationId).then((result) => {
		if (!(result.rowCount > 0)) {
			throw new Error('Application not registered with the service');
		}
	});
}

function registerApplication(){
	const uuid = uuidGen.v4();
	return application.insert(uuid).then(() => uuid);
}

module.exports = {
	registerApplication,
	isRegistered
};