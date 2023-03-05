import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { MyBotCommand } from './command.class.js';

export class MenuCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly logger: ILogger
	) {
		super(bot, logger);
	}
	public async handle(): Promise<void> {
		this.bot.command('menu', async (ctx) => {
			await ctx.scene.enter('menuScene');
		});
	}
}