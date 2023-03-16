import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { MyBotCommand } from './command.class.js';
import { Messenger } from '../types.js';
import { DbResponseStatus, IDatabase, IDbServices, IServiceUsageTable, IUsersTable } from '../storage/mysql.interface.js';
import { randomUUID } from 'crypto';
import { IUtils } from '../utils/utils.class.js';
import moment from 'moment';
import { ISessionService } from '../storage/session.interface.js';
import { Kysely } from 'kysely';
import { IConfigService } from '../config/config.interface.js';

export class StartCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly configService: IConfigService,
		public readonly logger: ILogger,
		private readonly sessionService: ISessionService,
		// public readonly dbServices: IDbServices,
		public readonly dbConnection: Kysely<IDatabase>,
		public readonly utils: IUtils
	) {
		super(
			bot,
			logger,
			// dbServices,
			dbConnection,
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
				} else {

					/**
					 * Проверяем наличие записи пользователя в БД
					 * и если такая запись есть - восстанавливаем botUserSession.userGuid
					 */

					// tslint:disable-next-line: no-shadowed-variable
					const { fromId, chatId } = this.utils.getChatIdObj(ctx);

					if (!fromId || !chatId) {
						throw new Error(`ERROR: missing fromId or chatId: fromId=${fromId}, chatId=${chatId}`);
					}

					const userRecRaw = await this.dbConnection
						.selectFrom('users')
						.select('guid')
						.where('fromId', '=', fromId)
						.where('chatId', '=', chatId)
						.execute();

					if (
						userRecRaw
						&& Array.isArray(userRecRaw)
						&& userRecRaw.length > 0
					) {

						// tslint:disable-next-line: no-shadowed-variable
						const { guid } = userRecRaw[0];

						ctx.session.botUserSession.userGuid = guid;

						this.sessionService.updateSession(ctx);

						await ctx.scene.enter('startNext');

					}

				}

				/**
				 * Создаём запись пользователя в БД
				 */

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

				// const resRaw = await this.dbServices.usersDbService?.create(userRec);

				const createUserRec = Object(userRec);

				await this.dbConnection
					.insertInto('users')
					.values(createUserRec)
					.execute();

				const resRaw = this.dbConnection
					.selectFrom('users')
					.selectAll()
					.where('guid', '=', guid)
					.execute();

				const { fromId, chatId } = this.utils.getChatIdObj(ctx);

				if (!resRaw) {
					throw new Error(`ERROR: could not create user record for guid=${guid} fromId=${fromId} chatId=${chatId}`);
				}

				/**
				 * Создаём запись использования сервисами для этого пользователя
				 */

				const serviceUsageGuid = randomUUID();

				const createServiceUsage: IServiceUsageTable = {
					createdAt: moment().utc().format(),
					updatedAt: moment().utc().format(),
					guid: serviceUsageGuid,
					userGuid: ctx.session.botUserSession.userGuid,
					gptPurchased: 0,
					gptUsed: 0,
					gptLeft: 0,
					gptFreeReceived: Number(this.configService.get('PACKAGE_GPT_FREE_QTY')),
					gptFreeUsed: 0,
					gptFreeLeft: Number(this.configService.get('PACKAGE_GPT_FREE_QTY')),
					mjPurchased: 0,
					mjUsed: 0,
					mjLeft: 0,
					mjFreeReceived: Number(this.configService.get('PACKAGE_MJ_FREE_QTY')),
					mjFreeUsed: 0,
					mjFreeLeft: Number(this.configService.get('PACKAGE_MJ_FREE_QTY')),
				};

				const createServiceUsageRec = Object(createServiceUsage);

				await this.dbConnection
					.insertInto('serviceUsage')
					.values(createServiceUsageRec)
					.execute();

				const serviceUsageRec = await this.dbConnection
					.selectFrom('serviceUsage')
					.selectAll()
					.where('guid', '=', serviceUsageGuid)
					.execute();

				if (!serviceUsageRec) {
					throw new Error(`ERROR: could not create service usage record for userGuid=${ctx.session.botUserSession.userGuid} fromId=${fromId} chatId=${chatId}`);
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