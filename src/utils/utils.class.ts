import { Redis } from 'ioredis';
import { Kysely } from 'kysely';
import { IBotContext } from '../bot/bot.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IDatabase } from '../storage/mysql.interface.js';
import wordCounter from '@homegrown/word-counter';
import { Sticker } from 'telegraf/types';

type GetChatIdObjResult = {
	fromId: number | undefined,
	chatId: number | undefined
};

export enum BroadcaseMsgCategory {
	all = 'all',
	inactive = 'inactive',
}

export interface IServiceUsageInfo {
	gptPurchased: number;
	gptLeft: number;
	mjPurchased: number;
	mjLeft: number;
	gptFreeLeft: number;
	mjFreeLeft: number;
	gptFreeReceived: number;
	mjFreeReceived: number;
}

export interface IWordCounter {
	words: number;
	lines: number;
	characters: number;
	charactersWithSpaces: number;
}

export interface IUtils {
	// tslint:disable-next-line: no-any
	errorLog: (that: any, err: unknown, methodName: string, addMsg?: string) => string;
	debugLogger: (arg: string) => void;
	isObject: (data: unknown) => boolean;
	clearSpecialChars: (str: string) => string;
	getChatIdStr: (ctx: IBotContext) => string;
	getChatIdObj: (ctx: IBotContext) => GetChatIdObjResult;
	getUserGuidByTelegramIds: (chatId: number, fromId: number) => Promise<string | unknown>;
	updateRedis: (redisKey: string, targetObject: string[], key: string, value: unknown) => Promise<void>;
	// tslint:disable-next-line: no-any
	getValRedis: (redisKey: string, targetObject: string[]) => Promise<any>;
	getServiceUsageInfo: (uid: string) => Promise<IServiceUsageInfo | undefined>;
	sleep: (milliseconds: number) => Promise<unknown>;
	enqueue: (collection: unknown[], data: unknown, size: number) => unknown[];
	dropcontext: (chatId: number, fromId: number) => Promise<void>;
	wordCounter: (text: string) => IWordCounter;
}

export class Utils implements IUtils {

	constructor(
		private readonly logger: ILogger,
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly redis: Redis
	) { }

	// tslint:disable-next-line: no-any
	public errorLog(that: any, err: unknown, methodName: string, addMsg?: string): string {
		let str: string;

		if (err instanceof Error) {
			str = `Error in [${that.constructor.name}:${methodName}]: ${err.message}${addMsg ? ', Additional info: ' + addMsg : ''}`;
			this.logger.error(str);
		} else {
			str = `Error in [${that.constructor.name}:${methodName}]${addMsg ? ', Additional info: ' + addMsg : ''}`;
			this.logger.error(str);
		}

		return str;
	}

	public debugLogger(str: string): void {
		const txt =
			`\n
============================= DEBUG LOG =============================
${str}
=====================================================================

`;
		this.logger.warn(txt);
	}

	public isObject(data: unknown): boolean {
		return typeof data === 'object' && data !== null && !Array.isArray(data);
	}

	public clearSpecialChars(str: string): string {
		return str.replace(/(?![a-zA-Z]|[а-яА-ЯёЁ]|[0-9]|[_\s-\(\),<>\|\!@#$%^&"№;:?*\[\]{}'\\\/\.])./g, '*') || '';
	}

	public getChatIdStr(ctx: IBotContext): string {
		return `${ctx.from?.id}:${ctx.chat?.id}`;
	}

	public getChatIdObj(ctx: IBotContext): GetChatIdObjResult {
		const fromId = ctx.from?.id ?? 0;
		const chatId = ctx.chat?.id ?? 0;
		return { fromId, chatId };
	}

	public async updateRedis(redisKey: string, targetObject: string[], valueKey: string, value: unknown): Promise<void> {
		const methodName = 'updateRedis';
		try {

			const dataStr = await this.redis.get(redisKey);

			if (!dataStr) {

				const newRec = Object({});
				newRec[valueKey] = value;

				this.logger.warn(`Redis: no data by key=${redisKey}, gonna create new record containing object:\n${JSON.stringify(newRec)}`);
				await this.redis.set(redisKey, JSON.stringify(newRec));

				return newRec;
			}

			const dataObj = JSON.parse(dataStr);

			if (!this.isObject(dataObj)) {
				throw new Error(`Redis: data by key=${redisKey} is not an object`);
			}

			const targetObj = targetObject.reduce((acc, elem) => {
				return acc[elem];
			}, dataObj);

			targetObj[valueKey] = value;

			if (targetObj.length > 0) {
				dataObj[targetObject[0]] = targetObj;
			}

			await this.redis.set(redisKey, JSON.stringify(dataObj));

			return dataObj;

		} catch (error) {
			this.errorLog(this, error, methodName);
		}
	}

	// tslint:disable-next-line: no-any
	public async getValRedis(redisKey: string, targetObject: string[]): Promise<any> {
		const methodName = 'getValRedis';
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

			return targetObj;

		} catch (error) {
			this.errorLog(this, error, methodName);
		}
	}

	public async getServiceUsageInfo(uid: string): Promise<IServiceUsageInfo | undefined> {
		const methodName = 'getServiceUsageInfo';
		try {

			const serviceUsageRecRaw = await this.dbConnection
				.selectFrom('serviceUsage')
				.selectAll()
				.where('userGuid', '=', uid)
				.execute();

			if (
				!serviceUsageRecRaw
				|| !Array.isArray(serviceUsageRecRaw)
				|| serviceUsageRecRaw.length !== 1
			) {
				throw new Error(`No or several serviceUsage recs for userGuid=${uid}`);
			}

			const res: IServiceUsageInfo = {
				gptPurchased: serviceUsageRecRaw[0].gptPurchased,
				gptLeft: serviceUsageRecRaw[0].gptLeft,
				mjPurchased: serviceUsageRecRaw[0].mjPurchased,
				mjLeft: serviceUsageRecRaw[0].mjLeft,
				gptFreeReceived: serviceUsageRecRaw[0].gptFreeReceived,
				gptFreeLeft: serviceUsageRecRaw[0].gptFreeLeft,
				mjFreeReceived: serviceUsageRecRaw[0].mjFreeReceived,
				mjFreeLeft: serviceUsageRecRaw[0].mjFreeLeft,
			};

			return res;

		} catch (error) {
			this.errorLog(this, error, methodName);
		}
	}

	public async sleep(milliseconds: number): Promise<unknown> {
		return new Promise(resolve => setTimeout(resolve, milliseconds));
	}

	public enqueue(collection: unknown[], data: unknown, size: number): unknown[] {
		const arr = [...collection];
		arr.push(data);
		if (arr.length > size) {
			arr.shift();
		}
		return arr;
	}

	public async getUserGuidByTelegramIds(chatId: number, fromId: number): Promise<string | undefined> {

		const methodName = 'getUserGuidByTelegramIds';

		try {

			const userRecRaw = await this.dbConnection
				.selectFrom('users')
				.selectAll()
				.where('chatId', '=', chatId)
				.where('fromId', '=', fromId)
				.execute();

			if (
				!userRecRaw
				|| !Array.isArray(userRecRaw)
				|| userRecRaw.length !== 1
			) {
				throw new Error(`None or several user recs for chatId=${chatId} and fromId=${fromId}, result:\n${JSON.stringify(userRecRaw)}`);
			}

			const { guid } = userRecRaw[0];

			return guid;

		} catch (error) {
			this.errorLog(this, error, methodName);
		}

	}

	public async dropcontext(chatId: number, fromId: number): Promise<void> {

		const methodName = 'dropcontext';

		try {

			const userGuid = await this.getUserGuidByTelegramIds(chatId, fromId);

			if (!userGuid) {
				throw new Error(`Could get user guid by chatId=${chatId} and fromId=${fromId}`);
			}

			await this.updateRedis(`${fromId}:${chatId}:${userGuid}`, [], 'chatGptMsgQueue', []);

		} catch (error) {
			this.errorLog(this, error, methodName);
		}

	}

	public wordCounter(text: string): IWordCounter {
		return wordCounter.count(text);
	}

}