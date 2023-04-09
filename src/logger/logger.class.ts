import { ILogger } from './logger.interface.js';

import { Container, Logger, LoggerOptions, createLogger, format, transports } from 'winston';
import { PapertrailTransport } from 'winston-papertrail-transport';
import { Config } from 'winston/lib/winston/config/index.js';
import { ConsoleTransportInstance, Transports } from 'winston/lib/winston/transports/index.js';
import { FormatInputPathObject } from 'path';
import { Format } from 'logform';
import { IConfigService } from '../config/config.interface.js';
import { config } from 'dotenv';

type UseTransports = ConsoleTransportInstance | PapertrailTransport;

export class UseLogger implements ILogger {

	private consoleTransport: ConsoleTransportInstance;
	private papertrailTransport: PapertrailTransport;
	private container: Container;
	private transports: UseTransports[];
	private format: Format;
	private useLogger: Logger;
	private useLoggerOptions: LoggerOptions;

	constructor(private readonly configService: IConfigService) {

		const host: string = configService.get('PAPERTRAIL_HOST');
		const port: number = parseInt(configService.get('PAPERTRAIL_PORT'));
		const hostname: string = configService.get('PAPERTRAIL_HOSTNAME');
		const program: string = configService.get('PAPERTRAIL_PROGRAM');

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
