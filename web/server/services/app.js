const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('winston');
const expressWinston = require('express-winston');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const chalk = require('chalk');
const Promise = require('bluebird');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const config = require('../../webpack.dev.config');
const db = require('./db');
const routes = require('../routes/index');

Promise.config({
  cancellation: true
});

global.Promise = Promise;

/**
 * Event listener for HTTP server "listening" event.
 */
const app = express();

app.use(express.static(path.join(__dirname, '../../public')));

if (app.get('env') === 'development') {

  const compiler = webpack(config);

  app.use(webpackDevMiddleware(compiler,
    {
      publicPath: config.output.publicPath,
      stats: {colors: true}
    }
  ));

  // Set the log level to debug
  logger.level = 'debug';

  // Use the environment variables specified in the .env file
  dotenv.config();

  // Return the stacktrace
  app.use(function (err, req, res, next) {
    logger.error(err);
    if (!res.headersSent) {
      res.status(err.status || 500).send(err);
    }
  });
}

app.use('/', routes);


// customise the log format
const components = [
  chalk.gray("{{req.method}}"),
  chalk.gray("{{req.url}}"),
  chalk.green("{{res.statusCode}}"),
  chalk.gray("{{res.responseTime}}ms")
];

// use winston as the default logger
app.use(expressWinston.logger({
  winstonInstance: logger,
  colorize: true,
  msg: components.join(' ')
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});


app.use((err, req, res) => {
	logger.error(err);
	if (!res.headersSent) {
		res.status(err.status || 500).send('Internal server error');
	}
});


module.exports = app;
