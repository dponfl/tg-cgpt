import { MiddlewareFn } from 'telegraf';
import { IBotContext, IBotSessionData } from '../bot/bot.interface.js';

const createSession: MiddlewareFn<IBotContext> = async (ctx, next) => {
	const userSession: IBotSessionData = {};

	if (ctx.from?.first_name) {
		userSession.firstname = ctx.from.first_name;
	}

	if (ctx.from?.last_name) {
		userSession.surname = ctx.from.last_name;
	}

	Object.assign(ctx, { ...ctx, userSession });

	return next();
};

export default createSession;