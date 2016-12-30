const request = require('request');

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

module.exports = {
  requestTopics
};
