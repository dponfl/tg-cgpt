import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import { IConfigService } from '../../config/config.interface.js';
import { AiTextResponse, AiResponseStatus, OpenAiChatFinishReason } from '../../controller/controller.interface.js';
import { ILogger } from '../../logger/logger.interface.js';
import { DbResponseStatus, IDbServices, IRequestsTable, RequestStatus, RequestTypes, SubSustems, Systems } from '../../storage/mysql.interface.js';
import { IUtils } from '../../utils/utils.class.js';
import { IAIText } from '../ai.interface.js';
import { IChatRequestParams, IOpenAiChatMessage, OpenAiChatModels } from './chat.interface.js';

export class OpenAiChatService implements IAIText {
	private readonly configuration: Configuration;
	private readonly openai: OpenAIApi;

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		public readonly dbServices: IDbServices,
		private readonly utils: IUtils
	) {

		this.configuration = new Configuration({
			apiKey: configService.get('OPENAI_API_KEY')
		});

		this.openai = new OpenAIApi(this.configuration);
	}

	private async generateRequestParams(params: IChatRequestParams): Promise<unknown> {

		const paramsObj = Object({});

		/**
		 * max_tokens
		 */
		const max_tokens = Number(this.configService.get('TC_MAX_TOKENS'));

		if (max_tokens) {
			paramsObj['max_tokens'] = max_tokens;
		}

		/**
		 * temperature
		 */
		const temperature = Number(this.configService.get('TC_TEMP'));

		if (temperature) {
			paramsObj['temperature'] = temperature;
		}

		/**
		 * top_p
		 */
		const top_p = Number(this.configService.get('TC_TOPP'));

		if (top_p) {
			paramsObj['top_p'] = top_p;
		}

		/**
		 * n
		 */
		const n = Number(this.configService.get('TC_N'));

		if (n) {
			paramsObj['n'] = n;
		}

		/**
		 * presence_penalty
		 */
		const presence_penalty = Number(this.configService.get('TC_P_PNLT'));

		if (presence_penalty) {
			paramsObj['presence_penalty'] = presence_penalty;
		}

		/**
		 * frequency_penalty
		 */
		const frequency_penalty = Number(this.configService.get('TC_F_PNLT'));

		if (frequency_penalty) {
			paramsObj['frequency_penalty'] = frequency_penalty;
		}


		return { ...params, ...paramsObj };
	}

	public async textRequest(userGuid: string, messages: IOpenAiChatMessage[]): Promise<AiTextResponse> {

		const methodName = 'textRequest';

		this.logger.info(`User: ${userGuid}, sending request to OpenAI (ChatGPT)`);

		try {

			const majorParams: IChatRequestParams = {
				model: OpenAiChatModels.GPT_3_5,
				messages,
			};

			const requestParams: IChatRequestParams = await this.generateRequestParams(majorParams) as IChatRequestParams;

			// TODO: delete
			this.logger.warn(`User: ${userGuid}, requestParams:\n${JSON.stringify(requestParams)}`);

			let requestCompleted: boolean = false;

			const startTime = new Date().getTime();

			const response = await this.openai.createChatCompletion(requestParams);

			const finishTime = new Date().getTime();

			this.logger.info(`User: ${userGuid}, openai.createChatCompletion response:\nStatus: ${response.status} Status text: ${response.statusText} Data: ${JSON.stringify(response.data)}`);

			requestCompleted = true;

			const requestCount = this.utils.wordCounter(messages[messages.length - 1].content);

			if (response.data.choices[0].message) {

				const responseCount = this.utils.wordCounter(response.data.choices[0].message.content);

				const requestMetricsRecSuccess: IRequestsTable = {
					userGuid,
					system: Systems.CHATGPT,
					subsystem: SubSustems.CHAT,
					requestType: RequestTypes.ORDINARY,
					requestStatus: RequestStatus.SUCCESS,
					duration: finishTime - startTime,
					requestWords: requestCount.words,
					responseWords: responseCount.words,
					responseTokens: response.data.usage?.completion_tokens,
					requestTokens: response.data.usage?.prompt_tokens,
					totalTokens: response.data.usage?.total_tokens,
				};

				const createRequestMetricsRecRaw = await this.dbServices.requestsDbService?.create(requestMetricsRecSuccess);

				if (createRequestMetricsRecRaw?.status !== DbResponseStatus.SUCCESS) {
					this.logger.error(`Requests metrics rec creation error. requestMetricsRec:\n${JSON.stringify(requestMetricsRecSuccess)}\nresult:\n${JSON.stringify(createRequestMetricsRecRaw)}`);
				}

				return {
					status: AiResponseStatus.SUCCESS,
					finishReason: response.data.choices[0].finish_reason ?? null,
					payload: response.data.choices[0].message.content
				};
			} else {

				const requestMetricsRecError: IRequestsTable = {
					userGuid,
					system: Systems.CHATGPT,
					subsystem: SubSustems.CHAT,
					requestType: RequestTypes.ORDINARY,
					requestStatus: RequestStatus.ERROR,
					duration: finishTime - startTime,
					requestWords: requestCount.words,
				};

				const createRequestMetricsRecRaw = await this.dbServices.requestsDbService?.create(requestMetricsRecError);

				if (createRequestMetricsRecRaw?.status !== DbResponseStatus.SUCCESS) {
					this.logger.error(`Requests metrics rec creation error. requestMetricsRec:\n${JSON.stringify(requestMetricsRecError)}\nresult:\n${JSON.stringify(createRequestMetricsRecRaw)}`);
				}

				return {
					status: AiResponseStatus.ERROR,
					payload: ''
				};
			}

		} catch (error) {
			return {
				status: AiResponseStatus.ERROR,
				payload: this.utils.errorLog(this, error, methodName)
			};
		}
	}

	// tslint:disable-next-line: promise-function-async
	public textStreamRequest(userGuid: string, messages: IOpenAiChatMessage[]): Promise<AiTextResponse> {

		return new Promise(async (resolve, reject) => {
			const methodName = 'textStreamRequest';

			const textResponse: string[] = [];
			let textResponseStr: string = '';

			this.logger.info(`User: ${userGuid}, sending stream request to OpenAI (ChatGPT)`);

			try {

				const options: AxiosRequestConfig = {
					responseType: 'stream'
				};


				const requestParams: IChatRequestParams = {
					model: OpenAiChatModels.GPT_3_5,
					messages,
					stream: true
				};

				// TODO: delete
				this.logger.warn(`User: ${userGuid}, stream requestParams:\n${JSON.stringify(requestParams)}`);

				const timeout = Number(this.configService.get('RESPONSE_TIMEOUT')) ?? Infinity;

				const timeOutId = setTimeout(() => {
					reject(`Request timeout at ${methodName}`);
				}, timeout);

				const startTime = new Date().getTime();

				const requestCount = this.utils.wordCounter(messages[messages.length - 1].content);

				const response: AxiosResponse = await this.openai.createChatCompletion(requestParams, options);

				this.logger.info(`User: ${userGuid}, stream openai.createChatCompletion response:\nStatus: ${response.status} Status text: ${response.statusText}`);

				response.data.on('data', (data: string): void => {

					const lines: string[] = data.toString().split('\n').filter((line: string) => line.trim() !== '');

					for (const line of lines) {
						// tslint:disable-next-line: no-shadowed-variable
						const data: string = line.replace(/^data: /, '').replace('\n', '');
						if (data === '[DONE]') {

							textResponseStr = textResponse.join('');

							this.logger.warn(`User: ${userGuid}, stream request completed: ${textResponseStr}`);

							clearTimeout(timeOutId);

							const finishTime = new Date().getTime();

							const responseCount = this.utils.wordCounter(textResponseStr);

							const requestMetricsRecSuccess: IRequestsTable = {
								userGuid,
								system: Systems.CHATGPT,
								subsystem: SubSustems.CHAT,
								requestType: RequestTypes.STREAM,
								requestStatus: RequestStatus.SUCCESS,
								duration: finishTime - startTime,
								requestWords: requestCount.words,
								responseWords: responseCount.words,
							};

							this.dbServices.requestsDbService?.create(requestMetricsRecSuccess)
								.then(
									// tslint:disable-next-line: no-any
									(result: any) => {
										if (result.status !== DbResponseStatus.SUCCESS) {
											this.logger.error(`Requests metrics rec creation error. requestMetricsRec:\n${JSON.stringify(requestMetricsRecSuccess)}\nresult:\n${JSON.stringify(result)}`);
										}
									},
									// tslint:disable-next-line: no-any
									(error: any) => {
										this.logger.error(`Promise error: Requests metrics rec creation error. requestMetricsRec:\n${JSON.stringify(requestMetricsRecSuccess)}\nresult:\n${typeof error === 'string' ? error : JSON.stringify(error)}`);
									}
								);

							resolve(
								{
									status: AiResponseStatus.SUCCESS,
									finishReason: OpenAiChatFinishReason.stop,
									payload: textResponseStr
								}
							);
							return;
						}

						const parsed = JSON.parse(data);

						// this.logger.info(`User: ${user}, parsed data:\n${JSON.stringify(parsed)}`);

						if (parsed.choices[0].delta?.content
							&& typeof parsed.choices[0].delta.content === 'string'
						) {
							textResponse.push(parsed.choices[0].delta.content);
						}

					}
				});

			} catch (error) {
				const errText = this.utils.errorLog(this, error, methodName);
				throw new Error(errText);
			}
		});

	}


}