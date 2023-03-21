import { IBotContext } from '../bot/bot.interface.js';

export interface ISessionService {
	updateSession: (ctx: IBotContext) => void;
	// tslint:disable-next-line: no-any
	saveSession: (fromId: number, chatId: number, session: any) => void;
}