import { Telegraf } from 'telegraf';
import { IBotService, IBotContext } from '../bot/bot.interface.js';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IOpenAI } from '../openai/text_completion/tc.interface.js';
import { IMainController } from './controller.interface.js';

export class MainController implements IMainController {

	private bot: Telegraf<IBotContext> = <Telegraf<IBotContext>>{};

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		private readonly botService: IBotService,
		private readonly openAi: IOpenAI,
	) { }


}