import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { MyBotCommand } from './command.class.js';
import { Messenger } from '../types.js';
import { DbResponseStatus, IDbServices, IUsersTable } from '../storage/mysql.interface.js';
import { randomUUID } from 'crypto';
import { IUtils } from '../utils/utils.class.js';
import moment from 'moment';
import { ISessionService } from '../storage/session.interface.js';

export class StartCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly logger: ILogger,
		private readonly sessionService: ISessionService,
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

		const errMsg = `Error at ${this.constructor.name}:handle => `;

		this.bot.start(async (ctx) => {
			try {

				await ctx.deleteMessage();

				/**
				 * Create user record if none
				 */

				if (ctx.session.botUserSession.userGuid) {
					await ctx.scene.enter('startNext');
				}

				const guid = randomUUID();

				ctx.session.botUserSession.userGuid = guid;

				this.sessionService.updateSession(ctx);

				const firstname_c = this.utils.clearSpecialChars(ctx.from?.first_name);

				const surname_c = this.utils.clearSpecialChars(ctx.from?.last_name ?? '');

				const userRec: IUsersTable = {
					guid,
					createdAt: moment().utc().format(),
					updatedAt: moment().utc().format(),
					firstname: ctx.from?.first_name ?? '',
					firstname_c,
					surname: ctx.from?.last_name ?? '',
					surname_c,
					username: ctx.from?.username ?? '',
					fromId: ctx.from?.id ?? '',
					chatId: ctx.chat?.id ?? '',
					region: 'ru',
					country: 'ru',
					messenger: Messenger.TELEGRAM,
					clientUnreachable: false,
					clientUnreachableDetails: '',
					deleted: false,
					banned: false,
					lang: ctx.from?.language_code ?? 'ru',
				};

				const resRaw = await this.dbServices.usersDbService?.create(userRec);

				if (resRaw?.status === DbResponseStatus.ERROR) {
					throw new Error(`Error: cannot create user record`);
				}

				await ctx.scene.enter('startIntro');

			} catch (error) {
				if (error instanceof Error) {
					this.logger.error(errMsg + error.message);
				}
			}

		});
	}

}