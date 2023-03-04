import { Context, Telegraf } from 'telegraf';

export interface IBotService {
	launch(): Promise<Telegraf<IMyContext>>;
}

export interface IMyContext extends Context {
	scene: any;
	firstname: string;
	surname: string;
}