import { IBotContext } from '../bot/bot.interface.js';

export interface IUtils {
	clearSpecialChars(str: string): string;
	getChatIds(ctx: IBotContext): string;
}

export class Utils implements IUtils {

	clearSpecialChars(str: string): string {
		return str.replace(/(?![a-zA-Z]|[а-яА-ЯёЁ]|[0-9]|[_\s-\(\),<>\|\!@#$%^&"№;:?*\[\]{}'\\\/\.])./g, '*') || '';
	}

	getChatIds(ctx: IBotContext): string {
		return `${ctx.from?.id}:${ctx.chat?.id}`;
	}

}