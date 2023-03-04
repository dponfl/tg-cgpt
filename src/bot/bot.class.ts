import { Telegraf } from 'telegraf';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IBot } from './bot.interface.js';

export class Bot implements IBot {

	public bot: Telegraf<any>;

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService
	) {
		this.bot = new Telegraf<any>(configService.get('TELEGRAM_TOKEN'));
	}

	launch(): void {
		throw new Error('Method not implemented.');
	}
}