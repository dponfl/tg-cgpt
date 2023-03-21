import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { MyBotCommand } from './command.class.js';
import { Messenger } from '../types.js';
import { DbResponseStatus, IDatabase, IDbServices } from '../storage/mysql.interface.js';
import { randomUUID } from 'crypto';
import { IUtils } from '../utils/utils.class.js';
import { ISessionService } from '../storage/session.interface.js';
import { Kysely } from 'kysely';
import { IConfigService } from '../config/config.interface.js';

export class StartCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly configService: IConfigService,
		public readonly logger: ILogger,
		private readonly sessionService: ISessionService,
		public readonly dbServices: IDbServices,
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

				let userGuidToUse: string = '';
				let seviceUsageGuidToUse: string = '';

				await ctx.deleteMessage();

				/**
				 * Create user record if none
				 */

				if (!ctx.session.botUserSession.userGuid) {

					/**
					 * Проверяем наличие записи пользователя в БД
					 * и если такая запись есть - восстанавливаем botUserSession.userGuid
					 */

					const { fromId, chatId } = this.utils.getChatIdObj(ctx);

					if (!fromId || !chatId) {
						throw new Error(`ERROR: missing fromId or chatId at ctx: fromId=${fromId}, chatId=${chatId}`);
					}


					const userRecRaw = await this.dbServices.usersDbService?.getByTelegramIds(chatId, fromId);

					if (!userRecRaw) {
						throw new Error(`Empty response from usersDbService.getByTelegramIds for chatId=${chatId} and fromId=${fromId}`);
					}

					if (userRecRaw.status === DbResponseStatus.SUCCESS) {

						/**
						 * Запись найдена - восстанавливаем ctx.session.botUserSession.userGuid
						 */

						const { guid: userGuid } = userRecRaw.payload[0];

						userGuidToUse = userGuid;

						ctx.session.botUserSession.userGuid = userGuidToUse;

						this.sessionService.updateSession(ctx);
					} else {

						/**
						 * Создаём запись пользователя в БД
						 */

						userGuidToUse = randomUUID();

						const firstname_c = this.utils.clearSpecialChars(ctx.from?.first_name);

						const surname_c = this.utils.clearSpecialChars(ctx.from?.last_name ?? '');

						const userRec = {
							guid: userGuidToUse,
							firstname: ctx.from?.first_name ?? '',
							firstname_c,
							surname: ctx.from?.last_name ?? '',
							surname_c,
							username: ctx.from?.username ?? '',
							fromId,
							chatId,
							region: 'ru',
							country: 'ru',
							messenger: Messenger.TELEGRAM,
							lang: ctx.from?.language_code ?? 'ru',
						};

						const userCreateResRaw = await this.dbServices.usersDbService?.create(userRec);

						if (
							!userCreateResRaw
							|| userCreateResRaw.status !== DbResponseStatus.SUCCESS
						) {
							throw new Error(`Could not create user rec for params:\n${JSON.stringify(userRec)}`);
						}

						ctx.session.botUserSession.userGuid = userGuidToUse;

						this.sessionService.updateSession(ctx);

					}

				}

				/**
				 * Create service usage record if none
				 */

				if (!ctx.session.botUserSession.serviceUsageGuid) {

					/**
					 * Проверяем наличие записи в servicesUsage для пользователя
					 * и если такая запись есть - восстанавливаем botUserSession.serviceUsageGuid
					 */

					const serviceUsageRecRaw = await this.dbServices.serviceUsageDbService?.getByUserGuid(userGuidToUse);

					if (!serviceUsageRecRaw) {
						throw new Error(`Empty response from serviceUsageDbService.getByUserGuid for userGuid=${userGuidToUse}`);
					}

					if (serviceUsageRecRaw.status === DbResponseStatus.SUCCESS) {

						/**
						 * Запись найдена - восстанавливаем ctx.session.botUserSession.serviceUsageGuid
						 */

						const { guid: serviceUsageGuid } = serviceUsageRecRaw.payload[0];

						seviceUsageGuidToUse = serviceUsageGuid;

						ctx.session.botUserSession.serviceUsageGuid = seviceUsageGuidToUse;

						this.sessionService.updateSession(ctx);

					} else {

						/**
						 * Создаём запись serviceUsage для этого пользователя
						 */

						seviceUsageGuidToUse = randomUUID();

						const createServiceUsage = {
							guid: seviceUsageGuidToUse,
							userGuid: userGuidToUse,
						};

						const serviceUsageCreateRecRaw = await this.dbServices.serviceUsageDbService?.create(createServiceUsage);

						if (
							!serviceUsageCreateRecRaw
							|| serviceUsageCreateRecRaw.status !== DbResponseStatus.SUCCESS
						) {
							throw new Error(`Could not create service usage rec for params:\n${createServiceUsage}`);
						}

						ctx.session.botUserSession.serviceUsageGuid = seviceUsageGuidToUse;

						this.sessionService.updateSession(ctx);

					}


				}


				/**
				 * Push to 'startNext' scene
				 */

				await ctx.scene.enter('startNext');

			} catch (error) {
				if (error instanceof Error) {
					this.logger.error(errMsg + error.message);
				}
			}

		});
	}

}