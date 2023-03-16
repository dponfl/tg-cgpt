import { Telegraf, session, Markup } from 'telegraf';
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
import { InfoCommand } from '../commands/info.command.js';
import { HelpCommand } from '../commands/help.command.js';
import RedisSession from 'telegraf-session-redis-upd';
import { IDatabase, IDbServices } from '../storage/mysql.interface.js';
import { ISessionService } from '../storage/session.interface.js';
import { BroadcaseMsgCategory, IUtils } from '../utils/utils.class.js';
import { IBroadcastService } from '../broadcast/bc.interface.js';
import { Kysely } from 'kysely';

export class BotService implements IBotService {

	private _bot: Telegraf<IBotContext>;

	private commands: MyBotCommand[] = [];
	// tslint:disable-next-line: no-any
	private scenesList: any[] = [];

	constructor(
		public readonly logger: ILogger,
		public readonly configService: IConfigService,
		public readonly scenesGenerator: ISceneGenerator,
		public readonly redisSession: RedisSession,
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly sessionService: ISessionService,
		public readonly utils: IUtils,
		private readonly broadcastService: IBroadcastService
	) {
		this._bot = new Telegraf<IBotContext>(configService.get('TELEGRAM_TOKEN'));
	}

	get bot(): Telegraf<IBotContext> {
		return this._bot;
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
			command: 'info',
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

		await this.specialChannelProcessing();

		return this.bot;
	}

	private async activateCommands(): Promise<void> {

		/**
		 * Init bot commands
		 */

		this.commands = [
			new StartCommand(this.bot, this.logger, this.sessionService, this.dbConnection, this.utils),
			new GptCommand(this.bot, this.logger, this.dbConnection, this.utils),
			new MjCommand(this.bot, this.logger, this.dbConnection, this.utils),
			new MenuCommand(this.bot, this.logger, this.dbConnection, this.utils),
			new PaymentCommand(this.bot, this.logger, this.dbConnection, this.utils),
			new InfoCommand(this.bot, this.logger, this.dbConnection, this.utils),
			new HelpCommand(this.bot, this.logger, this.dbConnection, this.utils),
		];

		for (const command of this.commands) {
			await command.handle();
		}

	}

	private async specialChannelProcessing(): Promise<void> {

		let msgToSend: string = '';

		const textSendToAll = 'Отправить всем 🤔';
		const textDoNotSend = 'Не отправлять ❌';

		// tslint:disable-next-line: no-any
		this.bot.on('message', async (ctx: any) => {

			const { chatId } = this.utils.getChatIdObj(ctx);

			if (chatId?.toString() !== this.configService.get('SIGNAL_GROUP_CHAT_ID')) {
				return;
			}

			msgToSend = ctx.update.message.text;

			const replyMsg = `Получено сообщение:\n\n${msgToSend}`;

			ctx.telegram.sendMessage(
				chatId,
				replyMsg,
				{
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: textSendToAll,
									callback_data: 'send_to_all',
								}
							],
							[
								{
									text: textDoNotSend,
									callback_data: 'do_not_send',
								}
							]
						]
					},
				}
			);

		});

		this.bot.action('send_to_all', async (ctx) => {

			try {

				await ctx.replyWithHTML(`✅ Вы выбрали: <b><i>${textSendToAll}</i></b>`);
				await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

				if (msgToSend) {

					await this.broadcastService.broadcastMsg(this.bot, BroadcaseMsgCategory.all, msgToSend);

					msgToSend = '';

				} else {
					this.logger.error(`Error: Broadcast message content is empty`);
				}

			} catch (error) {
				if (error instanceof Error) {
					this.logger.error(`Error: Broadcast message sending: "send_to_all" action error: ${error.message}`);
				} else {
					this.logger.error(`Error: Broadcast message sending: "send_to_all" action error`);
				}
			}

		});

		this.bot.action('do_not_send', async (ctx) => {
			try {

				await ctx.replyWithHTML(`✅ Вы выбрали: <b><i>${textDoNotSend}</i></b>`);
				await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
				msgToSend = '';

			} catch (error) {
				if (error instanceof Error) {
					this.logger.error(`Error: Broadcast message sending: "do_not_send" action error: ${error.message}`);
				} else {
					this.logger.error(`Error: Broadcast message sending: "do_not_send" action error`);
				}
			}
		});

	}

}