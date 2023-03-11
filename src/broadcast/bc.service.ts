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

		const broadcastAllUsers = async (bs: Telegraf<IBotContext>, text: string): Promise<void> => {
			try {

				const res = await this.dbServices.usersDbService?.getAll(['chatId']);
				this.logger.info(`Res: ${JSON.stringify(res, null, 2)}`);

			} catch (error) {
				this.utils.errorLog(error);
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
			this.utils.errorLog(error);
		}
	}
}