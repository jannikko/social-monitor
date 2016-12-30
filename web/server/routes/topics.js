const express = require('express');
const logger = require('winston');
const ai = require('../services/ai');

const router = express.Router({mergeParams: true});

const application = '037133f0-dc8e-47a2-a621-1b1af8910bda';

router.route('/api/topics').get((req, res) => {
  return ai.requestTopics(application)
    .then((response) => {
      return res.status(200).send(response);
    }, (err) => {
      logger.error(`Error when requesting topics for application ${application}: ${err}`);
      return res.status(500).send('Internal server error during registration');
    });
});

module.exports = router;
