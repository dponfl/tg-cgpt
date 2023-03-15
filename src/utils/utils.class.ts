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
	// tslint:disable-next-line: no-any
	errorLog(that: any, err: unknown, methodName: string): string;
	isObject(data: unknown): boolean;
	clearSpecialChars(str: string): string;
	getChatIdStr(ctx: IBotContext): string;
	getChatIdObj(ctx: IBotContext): GetChatIdObjResult;
}

export class Utils implements IUtils {

	constructor(
		private readonly logger: ILogger,
	) { }

	// tslint:disable-next-line: no-any
	errorLog(that: any, err: unknown, methodName: string): string {
		let str: string;

		if (err instanceof Error) {
			str = `Error in [${that.constructor.name}:${methodName}]: ${err.message}`;
			this.logger.error(str);
		} else {
			str = `Error in [${that.constructor.name}:${methodName}]`;
			this.logger.error(str);
		}

		return str;
	}

	isObject(data: unknown): boolean {
		return typeof data === 'object' && data !== null && !Array.isArray(data);
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