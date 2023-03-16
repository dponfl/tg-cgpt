import { Redis } from 'ioredis';
import { LOG_LEVELS } from 'kysely';
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
	errorLog: (that: any, err: unknown, methodName: string) => string;
	isObject: (data: unknown) => boolean;
	clearSpecialChars: (str: string) => string;
	getChatIdStr: (ctx: IBotContext) => string;
	getChatIdObj: (ctx: IBotContext) => GetChatIdObjResult;
	appendRedis: (redisKey: string, target: string[], key: string, value: unknown) => Promise<void>;
}

export class Utils implements IUtils {

	constructor(
		private readonly logger: ILogger,
		private readonly redis: Redis
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

	async appendRedis(redisKey: string, targetObject: string[], valueKey: string, value: unknown): Promise<void> {
		const methodName = 'appendRedis';
		try {

			const dataStr = await this.redis.get(redisKey);

			if (!dataStr) {
				throw new Error(`Redis: no data by key=${redisKey}`);
			}

			const dataObj = JSON.parse(dataStr);

			if (!this.isObject(dataObj)) {
				throw new Error(`Redis: data by key=${redisKey} is not an object`);
			}

			const targetObj = targetObject.reduce((acc, elem) => {
				return acc[elem];
			}, dataObj);

			// this.logger.info(`dataObj:\n${JSON.stringify(dataObj)}\n\ntargetObj:\n${JSON.stringify(targetObj)}`);

			targetObj[valueKey] = value;

			await this.redis.set(redisKey, JSON.stringify(targetObj));

			return targetObj;

		} catch (error) {
			this.errorLog(this, error, methodName);
		}
	}

}