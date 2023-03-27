import { ILogger } from './logger.interface.js';

import winston, { Container, Logger, LoggerOptions, createLogger, format, transports } from 'winston';
import { PapertrailTransport } from 'winston-papertrail-transport';
import { Config } from 'winston/lib/winston/config/index.js';
import { ConsoleTransportInstance, Transports } from 'winston/lib/winston/transports/index.js';
import { FormatInputPathObject } from 'path';
import { Format } from 'logform';

type UseTransports = ConsoleTransportInstance | PapertrailTransport;

export class UseLogger implements ILogger {

	private consoleTransport: ConsoleTransportInstance;
	private papertrailTransport: PapertrailTransport;
	private container: Container;
	private transports: UseTransports[];
	private format: Format;
	private useLogger: Logger;
	private useLoggerOptions: LoggerOptions;

	constructor(private readonly newrelic: any) {

		const host: string = process.env.PAPERTRAIL_HOST as string;
		const port: number = parseInt(process.env.PAPERTRAIL_PORT as string);
		const hostname: string = process.env.PAPERTRAIL_HOSTNAME as string;
		const program: string = process.env.PAPERTRAIL_PROGRAM as string;

		this.container = new Container();

		this.consoleTransport = new transports.Console();

		this.papertrailTransport = new PapertrailTransport({
			host,
			port,
			hostname,
			program,
		});

		// const newrelicWinstonFormatter = this.createFormatter();

		this.transports = [this.consoleTransport, this.papertrailTransport];

		this.format = format.combine(
			format.colorize(),
			format.timestamp(),
			format.simple(),
			format.printf((info) => `${info.timestamp} ${info.level} ${info.message}`),
			// newrelicWinstonFormatter()
		);

		this.useLoggerOptions = {
			format: this.format,
			transports: this.transports
		};

		this.useLogger = this.container.add(program, this.useLoggerOptions);
	}

	// private createModuleUsageMetric(agent: any): void {
	// 	agent.metrics
	// 		.getOrCreateMetric('Supportability/ExternalModules/WinstonLogEnricher')
	// 		.incrementCallCount();
	// }

	// private truncate(str: string): string {

	// 	const OUTPUT_LENGTH = 1024;
	// 	const MAX_LENGTH = 1021;

	// 	if (typeof str === 'string' && str.length > OUTPUT_LENGTH) {
	// 		return str.substring(0, MAX_LENGTH) + '...';
	// 	}

	// 	return str;

	// }

	// private createFormatter(): any {

	// 	// Stub API means agent is not enabled.
	// 	if (!this.newrelic.shim) {
	// 		// Continue to log original message with JSON formatter
	// 		return winston.format.json;
	// 	}

	// 	this.createModuleUsageMetric(this.newrelic.shim.agent);

	// 	const jsonFormatter = winston.format.json();

	// 	return winston.format((info, opts) => {
	// 		if (info.exception === true) {
	// 			// Due to Winston internals sometimes the error on the info object is a string or an
	// 			// empty object, and so the message property is all we have
	// 			const errorMessage = info.error.message || info.message || '';

	// 			info['error.message'] = this.truncate(errorMessage);
	// 			info['error.class'] =
	// 				info.error.name === 'Error' ? info.error.constructor.name : info.error.name;
	// 			info['error.stack'] = this.truncate(info.error.stack);
	// 			info.message = this.truncate(info.message);

	// 			// Removes additional capture of stack to reduce overall payload/log-line size.
	// 			// The server has a maximum of ~4k characters per line allowed.
	// 			delete info.trace;
	// 			delete info.stack;
	// 		}

	// 		if (info.timestamp) {
	// 			this.newrelic.shim.logger.traceOnce(
	// 				'Overwriting `timestamp` key; assigning original value to `original_timestamp`.'
	// 			);
	// 			info.original_timestamp = info.timestamp;
	// 		}
	// 		info.timestamp = Date.now();

	// 		const metadata = this.newrelic.getLinkingMetadata(true);

	// 		// Add the metadata to the info object being logged
	// 		Object.keys(metadata).forEach((m) => {
	// 			info[m] = metadata[m];
	// 		});

	// 		return jsonFormatter.transform(info, opts);
	// 	});

	// }

	info(str: string): void {
		this.useLogger.info(str);
		this.newrelic.recordLogEvent(
			{
				message: str,
				level: 'INFO',
				timestamp: new Date(),
			}
		);
	}

	warn(str: string): void {
		this.useLogger.warn(str);
		this.newrelic.recordLogEvent(
			{
				message: str,
				level: 'INFO',
				timestamp: new Date(),
			}
		);
	}

	error(str: string, err?: Error): void {
		this.useLogger.warn(str);
		this.newrelic.recordLogEvent(
			{
				message: str,
				level: 'ERROR',
				timestamp: new Date(),
				error: err
			}
		);
	}

}
