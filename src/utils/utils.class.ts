import { IBotContext } from '../bot/bot.interface.js';

type GetChatIdObjResult = {
	fromId: number | undefined,
	chatId: number | undefined
};

export enum BroadcaseMsgCategory {
	all = 'all',
	inactive = 'inactive',
}

export interface IUtils {
	clearSpecialChars(str: string): string;
	getChatIdStr(ctx: IBotContext): string;
	getChatIdObj(ctx: IBotContext): GetChatIdObjResult;
	broadcastMsg(category: BroadcaseMsgCategory, msg: string): Promise<void>;
}

export class Utils implements IUtils {

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

	async broadcastMsg(category: BroadcaseMsgCategory, msg: string): Promise<void> {
		throw new Error('broadcastMsg Method not implemented.');
	}

}