import { Kysely } from 'kysely';
import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IDatabase } from '../storage/mysql.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { MyBotCommand } from './command.class.js';

export class DropContextCommand extends MyBotCommand {
	constructor(
		public readonly bot: Telegraf<IBotContext>,
		public readonly logger: ILogger,
		public readonly dbConnection: Kysely<IDatabase>,
		public readonly utils: IUtils
	) {
		super(
			bot,
			logger,
			dbConnection,
			utils
		);
	}
	public async handle(): Promise<void> {


		// tslint:disable-next-line: no-any
		this.bot.command('dropcontext', async (ctx: any) => {

			const txt =
				`
			Контекст сброшен ✅
			`;

			const { chatId, fromId } = this.utils.getChatIdObj(ctx);

			this.logger.info(`Command /dropcontext by chatId=${chatId} and fromId=${fromId}`);

			if (chatId && fromId) {

				await this.utils.dropcontext(chatId, fromId);
				await ctx.replyWithHTML(txt);
			}
		});
	}
}