import { Telegraf } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';

export abstract class MyBotCommand {
	constructor(public readonly bot: Telegraf<IBotContext>) { }
	abstract handle(): Promise<void>;
}