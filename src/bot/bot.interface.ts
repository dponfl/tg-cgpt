import { Context, Telegraf } from 'telegraf';

export interface IBotService {
	init(): Promise<Telegraf<IBotContext>>;
}

export interface IBotSessionData {
	firstname?: string;
	surname?: string;
	pendingChatGptRequest?: boolean;
	pendingMjRequest?: boolean;
}

export interface IBotContext extends Context {
	session: any
	scene: any;
}