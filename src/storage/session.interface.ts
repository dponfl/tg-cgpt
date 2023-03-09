import { IBotContext } from '../bot/bot.interface.js';

export interface ISessionService {
	updateSession(ctx: IBotContext): void;
}