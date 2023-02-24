// /**
//  * Built-in Log Configuration
//  * (sails.config.log)
//  *
//  * Configure the log level for your app, as well as the transport
//  * (Underneath the covers, Sails uses Winston for logging, which
//  * allows for some pretty neat custom transports/adapters for log messages)
//  *
//  * For more information on the Sails logger, check out:
//  * https://sailsjs.com/docs/concepts/logging
//  */

// const { version } = require('../package');

// const { createLogger, format, transports } = require('winston');
// const { Loggly } = require('winston-loggly-bulk');
// const { PapertrailConnection, PapertrailTransport } = require('winston-3-papertrail');
// const { combine, timestamp, colorize, label, printf, align } = format;
// const { SPLAT } = require('triple-beam');
// const { isObject } = require('lodash');

// const levels = {
// 	silly: 6,
// 	verbose: 5,
// 	info: 4,
// 	debug: 3,
// 	warn: 2,
// 	error: 1,
// };

// function formatObject(param) {
// 	if (isObject(param)) {
// 		return JSON.stringify(param, null, 3);
// 	}
// 	return param;
// }

// // Ignore log messages if they have { private: true }
// const all = format((info) => {
// 	const splat = info[SPLAT] || [];
// 	const message = formatObject(info.message);
// 	const rest = splat.map(formatObject).join(' ');
// 	info.message = `${message} ${rest}`;
// 	return info;
// });

// const papertrailConnection = new PapertrailConnection({
// 	host: process.env.PAPERTRAIL_HOST || '',
// 	port: process.env.PAPERTRAIL_PORT || '',
// });

// const customLogger = createLogger({
// 	format: combine(
// 		all(),
// 		label({ label: version }),
// 		timestamp(),
// 		colorize({ all: true }),
// 		align(),
// 		printf(info => `${info.timestamp} [${info.label}] ${info.level}: ${formatObject(info.message)}`)
// 	),
// 	transports: [
// 		new transports.Console({
// 			levels,
// 			level: 'verbose',
// 		}),
// 		new PapertrailTransport(papertrailConnection, {
// 			colorize: true,
// 			levels,
// 			level: 'verbose',
// 			hostname: process.env.PAPERTRAIL_HOSTNAME || 'Bonanza',
// 			program: process.env.PAPERTRAIL_PROGRAM || 'Server',
// 		}),
// 		// new Loggly({
// 		//   token: process.env.LOGGLY_TOKEN || '',
// 		//   subdomain: process.env.LOGGLY_SUBDOMAIN || '',
// 		//   tags: ["Winston-NodeJS"],
// 		//   stripColors: true,
// 		//   json: true
// 		// }),
// 	]
// });

// module.exports.log = {

// 	/***************************************************************************
// 	 *                                                                          *
// 	 * Valid `level` configs: i.e. the minimum log level to capture with        *
// 	 * sails.log.*()                                                            *
// 	 *                                                                          *
// 	 * The order of precedence for log levels from lowest to highest is:        *
// 	 * silly, verbose, info, debug, warn, error                                 *
// 	 *                                                                          *
// 	 * You may also set the level to "silent" to suppress all logs.             *
// 	 *                                                                          *
// 	 ***************************************************************************/

// 	custom: customLogger,
// 	level: 'silly',
// 	inspect: false,

// };

