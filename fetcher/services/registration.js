const uuidGen = require('node-uuid');

const application = require('../models/application');

function isRegistered(applicationId){
	return application.get(applicationId).then((id) => Boolean(applicationId));
}

function registerApplication(){
	const uuid = uuidGen.v4();

	return application.insert(uuid).then(() => uuid);
}

module.exports = {
	registerApplication,
	isRegistered
};