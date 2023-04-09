import { MiddlewareFn } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';

const createSession: MiddlewareFn<IBotContext> = async (ctx: IBotContext, next) => {

	if (!ctx.session.botUserSession) {
		ctx.session.botUserSession = {
			firstname: ctx.from?.first_name || '',
			surname: ctx.from?.last_name || '',
		};
	}

	return next();
};

export default createSession;