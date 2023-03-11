import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';
import { BroadcaseMsgCategory } from '../utils/utils.class.js';

export interface IBroadcastService {
	broadcastMsg(botService: Telegraf<IBotContext>, category: BroadcaseMsgCategory, msg: string): Promise<void>;
}