import { Telegraf, session } from 'telegraf';
import { Stage } from 'telegraf/scenes';
import { BotCommand } from 'telegraf/types';
import { MyBotCommand } from '../commands/command.class.js';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { ISceneGenerator } from '../scenes/scenes.interface.js';
import { IBotService, IBotContext } from './bot.interface.js';
import createSession from '../middleware/user_session.js';
import { StartCommand } from '../commands/start.command.js';
import { MenuCommand } from '../commands/menu.command.js';
import { PaymentCommand } from '../commands/payment.command.js';

export class BotService implements IBotService {

	public bot: Telegraf<IBotContext>;

	private commands: MyBotCommand[] = [];
	private scenesList: any[] = [];

	/**
	 * list of commands the bot will handle 
	 */

	private readonly botCommands: readonly BotCommand[] = [
		{
			command: 'menu',
			description: 'Главное меню',
		},
		{
			command: 'img',
			description: 'Запрос в Midjorney',
		},
		{
			command: 'pay',
			description: 'Оплатить запросы',
		},
		{
			command: 'info',
			description: 'Информация по запросам',
		},
		{
			command: 'help',
			description: 'Помощь',
		},
	];

	constructor(
		private readonly logger: ILogger,
		configService: IConfigService,
		private readonly scenesGenerator: ISceneGenerator
	) {
		this.bot = new Telegraf<IBotContext>(configService.get('TELEGRAM_TOKEN'));
	}

	public async init(): Promise<Telegraf<IBotContext>> {

		this.scenesList = [... await this.scenesGenerator.getBaseScenes()];

		const stage = new Stage(this.scenesList);

		/**
		 * Init middlewares
		 */

		this.bot.use(session());
		this.bot.use(stage.middleware());
		this.bot.use(async (ctx, next) => {
			await createSession(ctx, next);
		});

		/**
		 * register available bot commands on telegram server
		 */

		this.bot.telegram.setMyCommands(this.botCommands);

		await this.activateCommands();

		return this.bot;
	}

	private async activateCommands(): Promise<void> {

		/**
		 * Init bot commands
		 */

		this.commands = [
			new StartCommand(this.bot, this.logger),
			new MenuCommand(this.bot, this.logger),
			new PaymentCommand(this.bot, this.logger),
		];

		for (const command of this.commands) {
			await command.handle();
		}

	}
}