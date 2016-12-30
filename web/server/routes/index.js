const express = require('express');
const router = express.Router();
const topics = require('./topics');

router.get('/', function(req, res, next) {
  res.sendFile('index.html');
});

router.use(topics);

module.exports = router;
