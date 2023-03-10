import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IDbServices } from '../storage/mysql.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { MyBotCommand } from './command.class.js';

export class PaymentCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly logger: ILogger,
		public readonly dbServices: IDbServices,
		public readonly utils: IUtils
	) {
		super(
			bot,
			logger,
			dbServices,
			utils
		);
	}
	public async handle(): Promise<void> {
		this.bot.command('pay', async (ctx) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('paymentScene');
		});
	}
}