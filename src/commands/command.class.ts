import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IDbServices } from '../storage/mysql.interface.js';
import { IUtils } from '../utils/utils.class.js';

export abstract class MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly logger: ILogger,
		public readonly dbServices: IDbServices,
		public readonly utils: IUtils
	) { }
	abstract handle(): Promise<void>;
}