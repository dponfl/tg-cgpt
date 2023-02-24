import { ILogger } from './logger.interface.js';

import { Container, Logger, LoggerOptions, createLogger, format, transports } from 'winston';
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

	constructor() {

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

		this.transports = [this.consoleTransport, this.papertrailTransport];

		this.format = format.combine(
			format.colorize(),
			format.timestamp(),
			format.simple(),
			format.printf((info) => `${info.timestamp} ${info.level} ${info.message}`)
		);

		this.useLoggerOptions = {
			format: this.format,
			transports: this.transports
		};

		this.useLogger = this.container.add(program, this.useLoggerOptions);
	}

	info(...args: unknown[]): void {
		this.useLogger.info(args);
	}

	warn(...args: unknown[]): void {
		this.useLogger.warn(args);
	}

	error(...args: unknown[]): void {
		this.useLogger.error(args);
	}

}
