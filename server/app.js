const http = require('http');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('winston');
const expressWinston = require('express-winston');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const chalk = require('chalk');

const routes = require('./routes/index');

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
	const port = parseInt(val, 10);

	if (isNaN(port)) return val;

	if (port >= 0) return port;

	return false;
}

/**
 * Event listener for HTTP server "listening" event.
 */
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	logger.level = 'debug';
	app.use(function (err, req, res, next) {
		res.status(err.status || 500).send(err);
	});
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res) => {
	res.status(err.status || 500).send('Internal server error');
});


/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '8080');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', (error) => {
		if (error.syscall !== 'listen') {
			throw error;
		}

		const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
		// handle specific listen errors with friendly messages
		switch (error.code) {
			case 'EACCES':
				logger.error(bind + ' requires elevated privileges');
				process.exit(1);
				break;
			case 'EADDRINUSE':
				logger.error(bind + ' is already in use');
				process.exit(1);
				break;
			default:
				throw error;
		}
	});

server.on('listening', () => {
	logger.debug(`Server started on port ${port}`);
});

