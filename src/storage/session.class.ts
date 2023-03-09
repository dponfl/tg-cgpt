import { IBotContext } from '../bot/bot.interface.js';
import { ISessionService } from './session.interface.js';
import RedisSession from 'telegraf-session-redis-upd';

export class SessionService implements ISessionService {
	constructor(private readonly redisSession: RedisSession) { }
	updateSession(ctx: IBotContext): void {
		const sessionKey = `${ctx.from?.id}:${ctx.chat?.id}`;
		this.redisSession.saveSession(sessionKey, ctx.session);
	}
}