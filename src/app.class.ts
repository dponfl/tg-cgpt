import { IOpenAI } from './openai/text_completion/tc.interface.js';
import { ILogger } from './logger/logger.interface.js';
import { IConfigService } from './config/config.interface.js';

export class App {

	private prompt: string = '';

	constructor(
		private readonly logger: ILogger,
		private readonly openAi: IOpenAI,
		private readonly configService: IConfigService
	) { }

	public async init(): Promise<void> {

		this.prompt = this.configService.get('PROMPT');

		this.logger.info('App.init() started');
		this.logger.warn(`The prompt is "${this.prompt}"`);

		const res = await this.openAi.sendTextRequest(this.prompt);
	}
}