import { IChatGpt } from './chatgpt/chatgpt.interface.js';
import { ILogger } from './logger/logger.interface.js';

export class App {

	private prompt: string = '';

	constructor(
		private readonly logger: ILogger,
		private readonly chatGpt: IChatGpt
	) { }

	init(): void {

		this.prompt = process.env.PROMPT as string;

		this.logger.info('App.init() started');
		this.logger.warn(`The prompt is "${this.prompt}"`);

		// const res = this.chatGpt.sendTextRequest(this.prompt);
	}
}