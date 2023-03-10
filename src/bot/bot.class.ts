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
import { GptCommand } from '../commands/gpt.command.js';
import { MjCommand } from '../commands/mj.command.js';
import { StatsCommand } from '../commands/stats.command.js';
import { HelpCommand } from '../commands/help.command.js';
import RedisSession from 'telegraf-session-redis-upd';
import { IDbServices } from '../storage/mysql.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { ISessionService } from '../storage/session.interface.js';

export class BotService implements IBotService {

	private bot: Telegraf<IBotContext>;

	private commands: MyBotCommand[] = [];
	// tslint:disable-next-line: no-any
	private scenesList: any[] = [];

	constructor(
		public readonly logger: ILogger,
		public readonly configService: IConfigService,
		public readonly scenesGenerator: ISceneGenerator,
		public readonly redisSession: RedisSession,
		public readonly dbServices: IDbServices,
		private readonly sessionService: ISessionService,
		public readonly utils: IUtils
	) {
		this.bot = new Telegraf<IBotContext>(configService.get('TELEGRAM_TOKEN'));
	}

	/**
	 * list of commands the bot will handle 
	 */

	private readonly botCommands: readonly BotCommand[] = [
		{
			command: 'menu',
			description: 'Главное меню',
		},
		{
			command: 'gpt',
			description: 'Запрос в ChatGPT',
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
			command: 'stats',
			description: 'Статистика по запросам',
		},
		{
			command: 'help',
			description: 'Помощь',
		},
		{
			command: 'start',
			description: 'Перезапустить бот',
		},
	];

	public async init(): Promise<Telegraf<IBotContext>> {

		this.scenesList = await this.scenesGenerator.getScenes();

		const stage = new Stage(this.scenesList);

		/**
		 * Init middlewares
		 */

		// this.bot.use(session());
		this.bot.use(this.redisSession);
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
			new StartCommand(this.bot, this.logger, this.sessionService, this.dbServices, this.utils),
			new GptCommand(this.bot, this.logger, this.dbServices, this.utils),
			new MjCommand(this.bot, this.logger, this.dbServices, this.utils),
			new MenuCommand(this.bot, this.logger, this.dbServices, this.utils),
			new PaymentCommand(this.bot, this.logger, this.dbServices, this.utils),
			new StatsCommand(this.bot, this.logger, this.dbServices, this.utils),
			new HelpCommand(this.bot, this.logger, this.dbServices, this.utils),
		];

		for (const command of this.commands) {
			await command.handle();
		}

	}
}