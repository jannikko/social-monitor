const request = require('request');
const uuid = require('uuid/v4');
const application = require('../models/application');
const querystring = require('querystring');

/**
 * Requests the ai service for the current topics of the application
 * @param {String} application
 * @returns {Promise}
 */
function requestTopics(application) {
  return new Promise((resolve, reject) => {
    request({
      method: 'GET',
      url: `http://127.0.0.1:5000/topics/${application}`,
      json: true
    }, (err, http, body) => {
      if (err) {
        return reject(err);
      } else if (http.statusCode !== 200) {
        reject(new Error(`Invalid response code when trying to request topics for application: ${application}\n${JSON.stringify(body)}`));
      } else {
        resolve(body);
      }
    });
  });
}

function registerApplication(name, twitterAccounts, twitterId, twitterSecret) {
  const applicationId = uuid();
  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: `http://127.0.0.1:5000/topics/register/${applicationId}`,
      json: {'twitterAccounts': twitterAccounts}
    }, (err, http, body) => {
      if (err) {
        return reject(err);
      } else if (http.statusCode !== 200) {
        reject(new Error(`Invalid response code when trying to request topics for application: ${applicationId}\n${JSON.stringify(body)}`));
      } else {
        resolve();
      }
    });
  }).then(() => {
    return new Promise((resolve, reject) => {
      request({
        method: 'POST',
        url: `http://127.0.0.1:8081/registration/register`,
        json: {'applicationId': applicationId}
      }, (err, http, body) => {
        if (err) {
          return reject(err);
        } else if (http.statusCode !== 200) {
          reject(new Error(`Invalid response code when trying to register application: ${applicationId}\n${JSON.stringify(body)}`));
        } else {
          resolve();
        }
      });
    });
  }).then(() => {
    return new Promise((resolve, reject) => {
      request({
        method: 'POST',
        url: `http://127.0.0.1:8081/twitter/register`,
        json: {
          applicationId: applicationId,
          twitterId: twitterId,
          twitterSecret: twitterSecret
        }
      }, (err, http, body) => {
        if (err) {
          return reject(err);
        } else if (http.statusCode !== 200) {
          reject(new Error(`Invalid response code when trying to register application: ${applicationId}\n${JSON.stringify(body)}`));
        } else {
          application.insert(applicationId, name)
            .then(resolve, reject);
        }
      });
    });
  })
}

function getApplications() {
  return application.getAll()
    .then((result) => {
      return result.rows;
    });
}


module.exports = {
  requestTopics,
  registerApplication,
  getApplications
};
