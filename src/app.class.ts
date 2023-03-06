import { ILogger } from './logger/logger.interface.js';
import { IBotContext, IBotService } from './bot/bot.interface.js';
import { Telegraf } from 'telegraf';

export class App {

	private bot: Telegraf<IBotContext> = <Telegraf<IBotContext>>{};

	constructor(
		private readonly logger: ILogger,
		private readonly botService: IBotService,
	) { }

	public async init(): Promise<void> {

		this.bot = await this.botService.init();

		/**
		 * default error handler
		 */

		this.bot.catch(async (error: unknown, ctx) => {
			this.logger.error('Bot error:', error);

			await ctx.reply('При обработке вашего сообщения что-то пошло не так.');
		});

		this.bot.launch();

		this.logger.info('App.init() started');

	}
}