import { Telegraf, session } from 'telegraf';
import { Stage } from 'telegraf/scenes';
import { BotCommand } from 'telegraf/types';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { ISceneGenerator } from '../scenes/scenes.interface.js';
import { IBotService, IMyContext } from './bot.interface.js';

export class BotService implements IBotService {

	public bot: Telegraf<IMyContext>;

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
		this.bot = new Telegraf<IMyContext>(configService.get('TELEGRAM_TOKEN'));
	}

	public async launch(): Promise<Telegraf<IMyContext>> {

		this.scenesList = [... await this.scenesGenerator.getBaseScenes()];

		const stage = new Stage(this.scenesList);

		this.bot.use(session());
		this.bot.use(stage.middleware());

		/**
		 * register available bot commands on telegram server
		 */

		this.bot.telegram.setMyCommands(this.botCommands);

		return this.bot;
	}
}