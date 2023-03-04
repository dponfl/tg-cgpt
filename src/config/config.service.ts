import { config, DotenvParseOutput } from 'dotenv';
import { ILogger } from '../logger/logger.interface.js';
import { IConfigService } from './config.interface.js';

export class ConfigService implements IConfigService {

	private config: DotenvParseOutput;

	constructor(private readonly logger: ILogger) {

		logger.info(`PROCESS.ENV: ${process.env}`);

		const { error, parsed } = config();

		if (error) {
			logger.error('Cannot find or parse .env file');
			throw new Error('Cannot find or parse .env file');
		}

		if (!parsed) {
			logger.error('File .env is empty');
			throw new Error('File .env is empty');
		}

		this.config = parsed;
	}

	get(key: string): string {

		const res = this.config[key];

		if (!res) {
			this.logger.error(`There is no ${key} key in .env file`);
			throw new Error(`There is no ${key} key in .env file`);
		}

		return res;

	}

}