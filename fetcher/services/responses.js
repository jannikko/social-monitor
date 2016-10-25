const _ = require('lodash');

const validation = require('../enums/validation');

function errorMessage(type, property) {
	return {type: type, property: property};
}

function invalidArguments(validationResult) {
	if (validationResult && validationResult.error) {
		return {errors: validationResult.error.details.map((detail) => errorMessage(validation.INVALID, (detail.path)))}
	} else {
		return {};
	}
}

module.exports = {
	errorMessage,
	invalidArguments
};