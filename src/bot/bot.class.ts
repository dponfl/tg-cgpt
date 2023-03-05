import { Telegraf, session } from 'telegraf';
import { Stage } from 'telegraf/scenes';
import { BotCommand } from 'telegraf/types';
import { MyBotCommand } from '../commands/command.class.js';
import { StartCommand } from '../commands/start.command.js';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { ISceneGenerator } from '../scenes/scenes.interface.js';
import { IBotService, IBotContext } from './bot.interface.js';

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

		this.bot.use(session());
		this.bot.use(stage.middleware());

		/**
		 * Init bot commands
		 */

		this.commands = [new StartCommand(this.bot)];

		for (const command of this.commands) {
			await command.handle();
		}

		/**
		 * register available bot commands on telegram server
		 */

		this.bot.telegram.setMyCommands(this.botCommands);

		return this.bot;
	}
}