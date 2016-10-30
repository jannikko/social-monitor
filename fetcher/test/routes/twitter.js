const sinon = require('sinon');
const assert = require('chai').assert;

const server = require('../helpers/server');
const validation = require('../../enums/validation');
const registration = require('../../services/registration');
const twitter = require('../../services/twitter');

describe('/twitter/register', function () {

	describe('with unregistered applicationId', () => {

		before(() => {
			sinon.stub(registration, 'isRegistered').rejects();
		});

		after(() => {
			registration.isRegistered.restore();
		});

		it('should respond with an error, if the validation fails', (done) => {
			server.post('/twitter/register')
				.send({
					applicationId: '02A8597A-C4D1-4857-858A-CF8258F871CF',
					twitterSecret: 'muchSecret',
					twitterId: 'suchWow'
				})
				.expect(401, {
					'error': {property: 'applicationId', type: validation.UNAUTHORIZED}
				}, done)
		});
	});

	describe('with registered applicationId', () => {

		const testUuid = '02A8597A-C4D1-4857-858A-CF8258F871CF';
		const testToken = 'testtoken';

		before(() => {
			sinon.stub(registration, 'isRegistered').resolves();
			sinon.stub(twitter, 'requestBearerToken').resolves(testToken);
			sinon.stub(twitter, 'registerApplication').resolves();
		});

		after(() => {
			twitter.requestBearerToken.restore();
			twitter.registerApplication.restore();
			registration.isRegistered.restore();
		});

		it('should respond with OK when registration is successful', (done) => {
			server.post('/twitter/register')
				.send({
					applicationId: testUuid,
					twitterSecret: 'muchSecret',
					twitterId: 'suchWow'
				})
				.expect(200, done)
		});

		it('should call registerApplication with the returned token and the applicationId', (done) => {
			assert.ok(twitter.registerApplication.calledOnce);
			assert.ok(twitter.registerApplication.calledWithExactly(testUuid, testToken));
			done();
		});

	});

	describe('validation', () => {
		it('should not accept an empty payload', function (done) {
			server.post('/twitter/register')
				.expect(400, {
					'errors': [
						{property: 'applicationId', type: validation.INVALID},
						{property: 'twitterId', type: validation.INVALID},
						{property: 'twitterSecret', type: validation.INVALID}
					]
				}, done)
		});
		it('should not accept invalid payloads', function (done) {
			server.post('/twitter/register')
				.send({applicationId: 'not-123-a-valid-uuid', twitterId: 'suchId', twitterSecret: 'muchSecret'})
				.expect(400, {
					'errors': [
						{property: 'applicationId', type: validation.INVALID}
					]
				}, done)
		});

	})

});
