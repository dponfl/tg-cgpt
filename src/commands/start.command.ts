import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { MyBotCommand } from './command.class.js';

export class StartCommand extends MyBotCommand {
	constructor(public readonly bot: Telegraf<IBotContext>) {
		super(bot);
	}
	public async handle(): Promise<void> {
		this.bot.start(async (ctx) => {

			ctx.userSession.firstname = ctx.from.first_name;

			await ctx.scene.enter('intro');
		});
	}

}