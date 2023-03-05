import { MiddlewareFn } from 'telegraf';
import { IBotContext } from '../bot/bot.interface.js';

const createSession: MiddlewareFn<IBotContext> = async (ctx, next) => {
	Object.assign(ctx, { ...ctx, userSession: {} });
	return next();
};

export default createSession;