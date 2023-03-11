import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';

type GetChatIdObjResult = {
	fromId: number | undefined,
	chatId: number | undefined
};

export enum BroadcaseMsgCategory {
	all = 'all',
	inactive = 'inactive',
}

export interface IUtils {
	errorLog(err: unknown): void;
	clearSpecialChars(str: string): string;
	getChatIdStr(ctx: IBotContext): string;
	getChatIdObj(ctx: IBotContext): GetChatIdObjResult;
}

export class Utils implements IUtils {

	constructor(
		private readonly logger: ILogger,
	) { }

	errorLog(err: unknown): void {
		if (err instanceof Error) {
			this.logger.error(`Error in [${this.constructor.name}:${this.constructor.call.name}]: ${err.message}`);
		} else {
			this.logger.error(`Error in [${this.constructor.name}:${this.constructor.call.name}]`);
		}
	}

	clearSpecialChars(str: string): string {
		return str.replace(/(?![a-zA-Z]|[а-яА-ЯёЁ]|[0-9]|[_\s-\(\),<>\|\!@#$%^&"№;:?*\[\]{}'\\\/\.])./g, '*') || '';
	}

	getChatIdStr(ctx: IBotContext): string {
		return `${ctx.from?.id}:${ctx.chat?.id}`;
	}


	getChatIdObj(ctx: IBotContext): GetChatIdObjResult {
		const fromId = ctx.from?.id;
		const chatId = ctx.chat?.id;
		return { fromId, chatId };
	}

}