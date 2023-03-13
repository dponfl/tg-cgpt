import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IDbServices } from '../storage/mysql.interface.js';
import { BroadcaseMsgCategory, IUtils } from '../utils/utils.class.js';
import { IBroadcastService } from './bc.interface.js';

export class BroadcastService implements IBroadcastService {
	constructor(
		private readonly logger: ILogger,
		private readonly dbServices: IDbServices,
		private readonly utils: IUtils
	) { }

	async broadcastMsg(botService: Telegraf<IBotContext>, category: BroadcaseMsgCategory, msg: string): Promise<void> {

		const methodName = 'broadcastMsg';

		const broadcastAllUsers = async (bs: Telegraf<IBotContext>, text: string): Promise<void> => {
			const methodName = 'broadcastAllUsers';
			try {

				const allRecs = await this.dbServices.usersDbService?.getAll(['chatId']);

				for (const rec of allRecs?.payload) {
					botService.telegram.sendMessage(
						rec.chatId,
						text,
						{
							parse_mode: 'HTML'
						}
					);
				}

			} catch (error) {
				this.utils.errorLog(error, methodName);
			}
		};

		try {

			switch (category) {
				case BroadcaseMsgCategory.all:
					await broadcastAllUsers(botService, msg);
					break;
				default:
					this.logger.error(`Uncovered category: ${category}`);
			}

		} catch (error) {
			this.utils.errorLog(error, methodName);
		}
	}
}