const express = require('express');
const router = express.Router();
const topics = require('./topics');
const path = require('path');


router.use(topics);

router.get('*', function(req, res, next) {
  res.sendFile('index.html', { root: path.join(__dirname, '../../public') });
});


module.exports = router;
