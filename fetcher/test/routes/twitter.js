const sinon = require('sinon');
const assert = require('chai').assert;
const _ = require('lodash');

const server = require('../helpers/server');
const validation = require('../../enums/validation');
const registration = require('../../services/registration');
const twitter = require('../../services/twitter');

describe('/twitter', function () {

	describe('POST /register', () => {

		const ENDPOINT = '/twitter/register';

		describe('with unregistered applicationId', () => {

			before(() => {
				sinon.stub(registration, 'isRegistered').rejects();
			});

			after(() => {
				registration.isRegistered.restore();
			});

			it('should respond with an error, if the validation fails', (done) => {
				server.post(ENDPOINT)
					.send({
						applicationId: '02A8597A-C4D1-4857-858A-CF8258F871CF',
						twitterSecret: 'muchSecret',
						twitterId: 'suchWow'
					})
					.expect(403, {
						'error': {property: 'applicationId', type: validation.FORBIDDEN}
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
				server.post(ENDPOINT)
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

			before(() => {
				sinon.stub(registration, 'isRegistered').resolves();
			});

			after(() => {
				registration.isRegistered.restore();
			});

			it('should not accept an empty payload', function (done) {
				server.post(ENDPOINT)
					.expect(400, {
						'errors': [
							{property: 'applicationId', type: validation.INVALID},
						]
					}, done)
			});

			it('should not accept invalid payloads', function (done) {
				server.post(ENDPOINT)
					.send({applicationId: 'not-123-a-valid-uuid', twitterId: 'suchId', twitterSecret: 'muchSecret'})
					.expect(400, {
						'errors': [
							{property: 'applicationId', type: validation.INVALID}
						]
					}, done)
			});
		});
	});

	describe('POST /timeline', function () {

		const ENDPOINT = '/twitter/timeline';

		describe('with unregistered applicationId', () => {

			before(() => {
				sinon.stub(registration, 'isRegistered').rejects();
			});

			after(() => {
				registration.isRegistered.restore();
			});

			it('should respond with an error, if the validation fails', (done) => {
				server.post(ENDPOINT)
					.send({
						applicationId: '02A8597A-C4D1-4857-858A-CF8258F871CF',
						accounts: ['test']
					})
					.expect(403, {
						'error': {property: 'applicationId', type: validation.FORBIDDEN}
					}, done);
			});
		});

		describe('validation', () => {

			before(() => {
				sinon.stub(registration, 'isRegistered').resolves();
			});

			after(() => {
				registration.isRegistered.restore();
			});

			it('should not accept an empty payload', function (done) {
				server.post(ENDPOINT)
					.expect(400, {
						'errors': [{property: 'applicationId', type: validation.INVALID}]
					}, done)
			});

			it('should not accept invalid payloads', function (done) {
				server.post(ENDPOINT)
					.send({applicationId: 'not-123-a-valid-uuid', twitterId: 'suchId', twitterSecret: 'muchSecret'})
					.expect(400, {
						'errors': [
							{property: 'applicationId', type: validation.INVALID}
						]
					}, done)
			});
		});

		describe('with registered applicationId', () => {

			const testUuid = '02A8597A-C4D1-4857-858A-CF8258F871CF';
			const testToken = 'testtoken';
			const goodMockResponse = {errors: [], dataStream: 123};
			const someBadMockResponse = {errors: [{screenName: 'outlandish'}], dataStream: 123};

			const goodRequest = {
				applicationId: testUuid,
				accounts: [{screenName: 'outlandish', sinceId: 123}, {screenName: 'leroyjenkins'}]
			};

			before(() => {
				sinon.stub(registration, 'isRegistered').resolves();
			});

			after(() => {
				registration.isRegistered.restore();
			});

			describe('with good data', () => {
				before(() => {
					sinon.stub(twitter, 'requestUserTimeline').resolves(goodMockResponse);
					sinon.stub(twitter, 'getApplicationToken').resolves(testToken);
					sinon.stub(twitter, 'storeTimelines').resolves(goodMockResponse);
				});

				after(() => {
					twitter.requestUserTimeline.restore();
					twitter.getApplicationToken.restore();
					twitter.storeTimelines.restore();
				});

				it('should respond with OK when registration is successful', (done) => {
					server.post(ENDPOINT)
						.send(goodRequest)
						.expect(200, done)
				});
			});

			describe('with some bad screenNames', () => {
				before(() => {
					sinon.stub(twitter, 'requestUserTimeline').resolves();
					sinon.stub(twitter, 'getApplicationToken').resolves(testToken);
					sinon.stub(twitter, 'storeTimelines').resolves(someBadMockResponse);
				});

				after(() => {
					twitter.requestUserTimeline.restore();
					twitter.getApplicationToken.restore();
					twitter.storeTimelines.restore();
				});

				it('should respond with 207 Multi-Status', (done) => {
					server.post(ENDPOINT)
						.send(goodRequest)
						.expect(207, {errors: [{screenName: 'outlandish'}], dataStreamId: 123})
						.end((err, res) => {
							if (err) throw err;
							done();
						})
				});
			});

			describe('without screenNames', () => {
				before(() => {
					sinon.stub(twitter, 'requestUserTimeline').resolves();
					sinon.stub(twitter, 'getApplicationToken').resolves(testToken);
				});

				after(() => {
					twitter.requestUserTimeline.restore();
					twitter.getApplicationToken.restore();
				});

				it('should respond with 400', (done) => {
					server.post(ENDPOINT)
						.send({
							applicationId: testUuid,
							accounts: []
						})
						.expect(400, done);
				});
			});

			describe('with good screenNames', () => {
				before(() => {
					sinon.stub(twitter, 'requestUserTimeline').resolves();
					sinon.stub(twitter, 'getApplicationToken').resolves(testToken);
					sinon.stub(twitter, 'storeTimelines').resolves(goodMockResponse);
				});

				after(() => {
					twitter.requestUserTimeline.restore();
					twitter.getApplicationToken.restore();
					twitter.storeTimelines.restore();
				});

				it('should respond with 200 OK', (done) => {
					server.post(ENDPOINT)
						.send(goodRequest)
						.expect(200, done)
				});

				it('should call storeTimelines for each good screenName', (done) => {
					assert.ok(twitter.storeTimelines.calledOnce);
					done();
				});
			});
		});
	});

	describe('GET /timeline', function () {

		const ENDPOINT = '/twitter/timeline/1';

		describe('good request', () => {

			before(() => {
				sinon.stub(twitter, 'getTimeline').resolves({"data": []});
			});

			after(() => {
				twitter.getTimeline.restore();
			});

			it('should respond with 200 OK', (done) => {
				server.get(ENDPOINT).expect(200, done);
			});
		});

		describe('good request with id not in db', () => {

			before(() => {
				sinon.stub(twitter, 'getTimeline').resolves(null);
			});

			after(() => {
				twitter.getTimeline.restore();
			});

			it('should respond with 404', (done) => {
				server.get(ENDPOINT).expect(404, done);
			});
		});
	});
});
