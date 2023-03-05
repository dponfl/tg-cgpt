import { Telegraf } from 'telegraf';
import { IBotService, IMyContext } from '../bot/bot.interface.js';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IOpenAI } from '../openai/text_completion/tc.interface.js';
import { IMainController } from './controller.interface.js';

export class MainController implements IMainController {

	private bot: Telegraf<IMyContext> = <Telegraf<IMyContext>>{};

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		private readonly botService: IBotService,
		private readonly openAi: IOpenAI,
	) { }

	public async run(): Promise<void> {

		this.bot = await this.botService.launch();

		this.bot.start(async (ctx) => {

			ctx.firstname = ctx.from.first_name;

			await ctx.scene.enter('intro');

		});

		/**
		 * default error handler
		 */

		this.bot.catch(async (error: unknown, ctx) => {
			this.logger.error('Bot error', error);

			await ctx.reply('При обработке вашего сообщения что-то пошло не так.');
		});

		this.bot.launch();

	}

}