import { Configuration, OpenAIApi } from 'openai';
import { IConfigService } from '../../config/config.interface.js';
import { AiTextResponse, AiResponseStatus } from '../../controller/controller.interface.js';
import { ILogger } from '../../logger/logger.interface.js';
import { IUtils } from '../../utils/utils.class.js';
import { IAIText } from '../ai.interface.js';
import { IChatRequestParams, IOpenAiChatMessage, OpenAiChatModels, OpenAiChatRoles } from './chat.interface.js';

export class OpenAiChatService implements IAIText {
	private readonly configuration: Configuration;
	// private options: AxiosRequestConfig;
	private readonly openai: OpenAIApi;

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		private readonly utils: IUtils
	) {

		this.configuration = new Configuration({
			apiKey: configService.get('OPENAI_API_KEY')
		});

		this.openai = new OpenAIApi(this.configuration);

		// this.options = {
		// 	responseType: 'stream'
		// };
	}

	public async textRequest(user: string, prompt: string): Promise<AiTextResponse> {

		const methodName = 'textRequest';

		this.logger.info(`User: ${user}, sending request to OpenAI (ChatGPT)`);

		try {

			const message: IOpenAiChatMessage = {
				role: OpenAiChatRoles.USER,
				content: prompt
			};

			const requestParams: IChatRequestParams = {
				model: OpenAiChatModels.GPT_3_5,
				messages: [message]
			};

			const max_tokens = Number(this.configService.get('MAX_TOKENS'));

			// TODO: delete
			this.logger.warn(`max_tokens:\n${max_tokens}`);


			if (max_tokens) {
				requestParams.max_tokens = max_tokens;
			}

			// TODO: delete
			this.logger.warn(`User: ${user}, requestParams:\n${JSON.stringify(requestParams)}`);

			let requestCompleted: boolean = false;

			const response = await this.openai.createChatCompletion(requestParams);

			this.logger.info(`User: ${user}, openai.createChatCompletion response:\nStatus: ${response.status} Status text: ${response.statusText} Data: ${JSON.stringify(response.data)}`);

			requestCompleted = true;

			if (response.data.choices[0].message) {
				return {
					status: AiResponseStatus.SUCCESS,
					payload: [response.data.choices[0].message.content]
				};
			} else {
				return {
					status: AiResponseStatus.ERROR,
					payload: []
				};
			}

		} catch (error) {
			return {
				status: AiResponseStatus.ERROR,
				payload: [this.utils.errorLog(this, error, methodName)]
			};
		}
	}

}