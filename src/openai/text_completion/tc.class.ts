import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CreateCompletionRequest, CreateCompletionResponse, OpenAIApi } from 'openai/dist/api.js';
import { Configuration } from 'openai/dist/configuration.js';
import { IConfigService } from '../../config/config.interface.js';
import { ILogger } from '../../logger/logger.interface.js';
import { IOpenAI } from './tc.interface.js';

export class OpenAICommunication implements IOpenAI {

	private configuration: Configuration;
	private openai: OpenAIApi;
	private prompt: string;
	private createCompletionRequest: CreateCompletionRequest;
	private options: AxiosRequestConfig;
	private textResponse: string[] = [];
	private textResponseStr: string = '';

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService
	) {

		this.configuration = new Configuration({
			apiKey: configService.get('OPENAI_API_KEY'),
		});

		this.openai = new OpenAIApi(this.configuration);

		this.prompt = configService.get('PROMPT');

		this.createCompletionRequest = this.buildTextCompletionParams();

		this.options = {
			responseType: 'stream'
		};

	}

	buildTextCompletionParams(): CreateCompletionRequest {

		const params: CreateCompletionRequest = {
			model: this.configService.get('TC_MODEL')
				? this.configService.get('TC_MODEL')
				: 'text-davinci-003',
			prompt: this.prompt,
			max_tokens: 4000 - this.prompt.length,
			temperature: parseInt(this.configService.get('TC_TEMP')),
			top_p: parseFloat(this.configService.get('TC_TOPP')),
			presence_penalty: parseFloat(this.configService.get('TC_P_PNLT')),
			frequency_penalty: parseFloat(this.configService.get('TC_F_PNLT')),
			stream: true
		};

		return params;
	}

	public async sendTextRequest(prompt: string): Promise<string | void> {

		try {

			this.logger.info('Sending request to OpenAI (ChatGPT)');

			let requestCompleted: boolean = false;

			const response: AxiosResponse = await this.openai.createCompletion(this.createCompletionRequest, this.options);

			response.data.on('data', (data: string): void => {

				// this.logger.info(`Data received: ${data}`);

				const lines: string[] = data.toString().split('\n').filter((line: string) => line.trim() !== '');

				for (const line of lines) {
					const message: string = line.replace(/^data: /, '').replace('\n', '');
					if (message === '[DONE]') {

						this.textResponseStr = this.textResponse.join('');
						this.logger.warn(`\n\nRequest completed: ${this.textResponseStr}`);

						requestCompleted = true;
						return;
					}

					const parsed: CreateCompletionResponse = JSON.parse(message);

					if (typeof parsed.choices[0].text === 'string') {
						this.textResponse.push(parsed.choices[0].text);
						this.logger.info(`data: [${parsed.choices[0].text}]`);
					} else {
						this.logger.error('Received text is not string');
					}

				}
			});

			if (requestCompleted) {
				return this.textResponseStr;
			}

		} catch (err) {

			if (err instanceof Error) {
				throw err;
			}

		}

	}

}