import { Context } from 'telegraf';

export interface IBotService {
	launch(): void;
}

export interface IMyContext extends Context {
	scene: any;
	firstname: string;
	surname: string;
}