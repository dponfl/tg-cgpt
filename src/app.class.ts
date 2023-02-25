import { IOpenAI } from './openai/text_completion/tc.interface.js';
import { ILogger } from './logger/logger.interface.js';

export class App {

	private prompt: string = '';

	constructor(
		private readonly logger: ILogger,
		private readonly openAi: IOpenAI
	) { }

	public async init(): Promise<void> {

		this.prompt = process.env.PROMPT as string;

		this.logger.info('App.init() started');
		this.logger.warn(`The prompt is "${this.prompt}"`);

		const res = await this.openAi.sendTextRequest(this.prompt);
	}
}