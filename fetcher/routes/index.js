const express = require('express');
const router = express.Router();

const timeline = require('./timeline');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/timeline', timeline);

module.exports = router;