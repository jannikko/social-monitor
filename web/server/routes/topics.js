const express = require('express');
const logger = require('winston');
const ai = require('../services/ai');

const router = express.Router({mergeParams: true});

router.route('/api/topics/:applicationId').get((req, res) => {
  const applicationId = req.params.applicationId;
  return ai.requestTopics(applicationId)
    .then((response) => {
      return res.status(200).send(response);
    }, (err) => {
      logger.error(`Error when requesting topics for application ${applicationId}: ${err}`);
      return res.status(500).send('Internal server error during request');
    });
});

router.route('/api/applications').get((req, res) => {
  return ai.getApplications()
    .then((accounts) => {
      return res.status(200).send(accounts);
    }, (err) => {
      logger.error(`Error when selecting all accounts: ${err}`);
      return res.status(500).send('Internal server error during request');
    });
});

router.route('/api/topics').post((req, res) => {
  const name = req.body.name;
  const twitterAccounts = req.body.twitterAccounts;
  const twitterId = req.body.twitterId;
  const twitterSecret = req.body.twitterSecret;
  return ai.registerApplication(name, twitterAccounts, twitterId, twitterSecret)
    .then(() => {
      return res.status(200).send();
    }, (err) => {
      logger.error(`Error when registering topics for application: ${err}`);
      return res.status(500).send('Internal server error during registration');
    });
});

module.exports = router;
