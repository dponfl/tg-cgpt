import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { MyBotCommand } from './command.class.js';
import { Messenger } from '../types.js';
import { DbResponseStatus, IDbServices, IUsersTable } from '../storage/mysql.interface.js';
import { randomUUID } from 'crypto';

export class StartCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly logger: ILogger,
		private readonly dbServices: IDbServices
	) {
		super(bot, logger);
	}

	public async handle(): Promise<void> {

		const errMsg = `Error at ${this.constructor.name}:handle => `;

		this.bot.start(async (ctx) => {
			try {

				await ctx.deleteMessage();

				/**
				 * Create user record if none
				 */

				this.logger.info('1');

				if (ctx.session.botUserSession.userGuid) {
					return;
				}

				this.logger.info('2');

				const guid = randomUUID();

				this.logger.info('3');

				const userRec: IUsersTable = {
					guid,
					firstname: ctx.from?.first_name || '',
					surname: ctx.from?.last_name || '',
					username: ctx.from?.username || '',
					fromId: ctx.from?.id || '',
					chatId: ctx.chat?.id || '',
					region: 'RU',
					country: 'RU',
					messenger: Messenger.TELEGRAM,
					clientUnreachable: false,
					clientUnreachableDetails: '',
					deleted: false,
					banned: false,
					lang: ctx.from?.language_code || 'RU'
				};

				this.logger.info('4');

				const resRaw = await this.dbServices.usersDbService?.createUser(userRec);

				this.logger.info('5');

				if (resRaw?.status === DbResponseStatus.ERROR) {
					throw new Error(`Error: cannot create user record`);
				}

				this.logger.info('6');

				await ctx.scene.enter('startIntro');

			} catch (error) {
				if (error instanceof Error) {
					this.logger.error(errMsg + error.message);
				}
			}

		});
	}

}