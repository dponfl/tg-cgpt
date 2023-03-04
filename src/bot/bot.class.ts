import { Telegraf } from 'telegraf';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IBotService } from './bot.interface.js';

export class BotService implements IBotService {

	public bot: Telegraf<any>;

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService
	) {
		this.bot = new Telegraf<any>(configService.get('TELEGRAM_TOKEN'));

		this.bot.start(ctx => ctx.reply(`Hello, ${ctx.from.first_name}!!!`));
	}

	launch(): void {
		this.bot.launch();
	}
}