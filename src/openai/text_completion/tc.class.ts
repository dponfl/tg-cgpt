import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CreateCompletionRequest, CreateCompletionResponse, OpenAIApi } from 'openai/dist/api.js';
import { Configuration } from 'openai/dist/configuration.js';
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

	constructor(private readonly logger: ILogger) {

		this.checkCredentials();

		this.configuration = new Configuration({
			apiKey: process.env.OPENAI_API_KEY,
		});

		this.openai = new OpenAIApi(this.configuration);

		this.prompt = process.env.PROMPT as string;

		this.createCompletionRequest = {
			model: 'text-davinci-003',
			prompt: this.prompt,
			max_tokens: 4000 - this.prompt.length,
			stream: true
		};

		this.options = {
			responseType: 'stream'
		};

	}

	checkCredentials(): void {

		if (!process.env.OPENAI_API_KEY) {
			throw new Error('No process.env.OPENAI_API_KEY');
		}

		if (typeof process.env.OPENAI_API_KEY !== 'string') {
			throw new Error('process.env.OPENAI_API_KEY must be a string');
		}

		if (!process.env.PROMPT) {
			throw new Error('No process.env.PROMPT');
		}

		if (typeof process.env.PROMPT !== 'string') {
			throw new Error('process.env.PROMPT must be a string');
		}

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