import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { MyBotCommand } from './command.class.js';

export class HelpCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly logger: ILogger
	) {
		super(bot, logger);
	}
	public async handle(): Promise<void> {
		this.bot.command('help', async (ctx: any) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('helpScene');
		});
	}
}