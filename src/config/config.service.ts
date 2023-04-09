import { config, DotenvParseOutput } from 'dotenv';
import { IConfigService } from './config.interface.js';

export class ConfigService implements IConfigService {

	private config: DotenvParseOutput;

	constructor() {

		if (process.env.NODE_ENV === 'production') {

			this.config = { ...process.env } as DotenvParseOutput;

		} else {

			const { error, parsed } = config();

			if (error) {
				throw new Error('Cannot find or parse .env file');
			}

			if (!parsed) {
				throw new Error('File .env is empty');
			}

			this.config = parsed;
		}
	}

	get(key: string): string {

		const res = this.config[key];

		if (!res) {
			// this.logger.error(`There is no ${key} key in .env file`);
			throw new Error(`There is no ${key} key in .env file`);
		}

		return res;

	}

}