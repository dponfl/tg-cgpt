import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { MyBotCommand } from './command.class.js';

export class StartCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly logger: ILogger
	) {
		super(bot, logger);
	}
	public async handle(): Promise<void> {
		this.bot.start(async (ctx) => {
			await ctx.scene.enter('startIntro');
		});
	}
}