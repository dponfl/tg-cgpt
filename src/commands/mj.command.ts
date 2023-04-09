import { Kysely } from 'kysely';
import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IDatabase } from '../storage/mysql.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { MyBotCommand } from './command.class.js';

export class MjCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly logger: ILogger,
		public readonly dbConnection: Kysely<IDatabase>,
		public readonly utils: IUtils
	) {
		super(
			bot,
			logger,
			dbConnection,
			utils
		);
	}
	public async handle(): Promise<void> {
		this.bot.command('img', async (ctx: any) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('mainMJScene');
		});
	}
}