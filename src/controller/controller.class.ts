import { Kysely } from 'kysely';
import { IAIImg, IAIText } from '../ai/ai.interface.js';
import { IOpenAiChatMessage, OpenAiChatRoles } from '../ai/open_ai/chat.interface.js';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IDatabase, IDbServices } from '../storage/mysql.interface.js';
import { IUtils } from '../utils/utils.class.js';
// tslint:disable-next-line: max-line-length
import { AiImgResponsePayload, AiResponseStatus, AiServices, AiTextResponse, AiTextResponsePayload, ControllerStatus, IMainController, RequestCategory } from './controller.interface.js';

export class MainController implements IMainController {

	private chatGptMsgQueueSize: number;

	constructor(
		private readonly configService: IConfigService,
		private readonly logger: ILogger,
		private readonly utils: IUtils,
		private readonly chatGptService: IAIText,
		private readonly mjService: IAIImg,
		private readonly dbConnection: Kysely<IDatabase>,
		public readonly dbServices: IDbServices,
	) {
		this.chatGptMsgQueueSize = Number(configService.get('CHATGPT_MSG_QUEUE_SIZE')) ?? 5;
	}

	// tslint:disable-next-line: max-line-length
	public async orchestrator<T>(userGuid: string, chatId: number, fromId: number, prompt: string, requestCategory: RequestCategory): Promise<T> {

		const methodName = 'orchestrator';

		let result: unknown;
		let payload;

		switch (requestCategory) {
			case RequestCategory.chatText:

				const checkUserRightsResult = await this.checkUserRights(userGuid, AiServices.GTP);


				if (!checkUserRightsResult) {

					result = {
						status: ControllerStatus.ACTION_PAYMENT,
						payload: null,
					};

				} else {

					payload = await this.textRequest(userGuid, chatId, fromId, prompt);

					result = {
						status: ControllerStatus.SUCCESS,
						payload,
					};

					await this.updateUserRightsOnSuccessfulResponse(userGuid, AiServices.GTP);

				}

				break;

			case RequestCategory.chatTextStream:

				payload = await this.textStreamRequest(userGuid, chatId, fromId, prompt);

				result = {
					status: ControllerStatus.SUCCESS,
					payload,
				};

				break;

			default:
				const error = new Error(`Unknown requestCategory: ${requestCategory}`);
				this.utils.errorLog(this, error, methodName);
				throw error;
		}

		return result as T;
	}

	private async getChatGptMsgQueue() { }

	private async setChatGptMsgQueue() { }

	private async checkUserRights(userGuid: string, serviceCategory: AiServices): Promise<boolean> {

		const methodName = 'checkUserRights';

		try {

			switch (serviceCategory) {
				case AiServices.GTP:

					const serviceUsageRecRaw = await this.dbConnection
						.selectFrom('serviceUsage')
						.selectAll()
						.where('userGuid', '=', userGuid)
						.execute();

					if (
						!serviceUsageRecRaw
						|| !Array.isArray(serviceUsageRecRaw)
						|| serviceUsageRecRaw.length !== 1
					) {
						throw new Error(`Wrong serviceUsage record:\n${serviceUsageRecRaw}`);
					}

					const { gptFreeLeft, gptLeft } = serviceUsageRecRaw[0];

					const availableRequests = gptFreeLeft + gptLeft;

					if (availableRequests > 0) {
						return true;
					}

					break;
				case AiServices.MJ:
					throw new Error(`MJ service not implemented yet (checkUserRights)`);
					break;
				default:
					const error = new Error(`Unknown serviceCategory: ${serviceCategory}`);
					this.utils.errorLog(this, error, methodName);
					throw error;
			}

			return false;

		} catch (error) {
			this.utils.errorLog(this, error, methodName);
			throw error;
		}
	}

	private async updateUserRightsOnSuccessfulResponse(userGuid: string, serviceCategory: AiServices): Promise<void> {

		const methodName = 'updateUserRightsOnSuccessfulResponse';

		try {

			switch (serviceCategory) {
				case AiServices.GTP:

					const serviceUsageRecRaw = await this.dbConnection
						.selectFrom('serviceUsage')
						.selectAll()
						.where('userGuid', '=', userGuid)
						.execute();

					if (
						!serviceUsageRecRaw
						|| !Array.isArray(serviceUsageRecRaw)
						|| serviceUsageRecRaw.length !== 1
					) {
						throw new Error(`Wrong serviceUsage record:\n${serviceUsageRecRaw}`);
					}

					const { guid, gptFreeLeft, gptFreeUsed, gptUsed, gptLeft } = serviceUsageRecRaw[0];

					if (gptFreeLeft > 0) {
						await this.dbConnection
							.updateTable('serviceUsage')
							.set({
								gptFreeLeft: gptFreeLeft - 1,
								gptFreeUsed: gptFreeUsed + 1
							})
							.where('guid', '=', guid)
							.execute();
					} else if (gptLeft > 0) {
						await this.dbConnection
							.updateTable('serviceUsage')
							.set({
								gptLeft: gptLeft - 1,
								gptUsed: gptUsed + 1
							})
							.where('guid', '=', guid)
							.execute();
					} else {
						throw new Error(`Both gptFreeLeft and gptLeft less or equal 0, rec:\n${JSON.stringify(serviceUsageRecRaw[0])}`);
					}

					break;
				case AiServices.MJ:
					throw new Error(`MJ service not implemented yet (checkUserRights)`);
					break;
				default:
					const error = new Error(`Unknown serviceCategory: ${serviceCategory}`);
					this.utils.errorLog(this, error, methodName);
					throw error;
			}

		} catch (error) {
			this.utils.errorLog(this, error, methodName);
			throw error;
		}

	}

	// tslint:disable-next-line: max-line-length
	public async textRequest(userGuid: string, chatId: number, fromId: number, prompt: string): Promise<AiTextResponsePayload[]> {

		const result: AiTextResponsePayload[] = [];

		/**
		 * Здесь может быть слелано несколько запросов к различным системат
		 */

		const message: IOpenAiChatMessage = {
			role: OpenAiChatRoles.USER,
			content: prompt
		};

		let chatGptMsgQueue = await this.utils.getValRedis(`${fromId}:${chatId}`, ['chatGptMsgQueue']);

		this.utils.debugLogger(`chatGptMsgQueue 1:\n${JSON.stringify(chatGptMsgQueue)}`);

		if (!chatGptMsgQueue) {
			chatGptMsgQueue = [];
		}

		if (chatGptMsgQueue && !Array.isArray(chatGptMsgQueue)) {
			this.logger.error(`chatGptMsgQueue has wrong content (not array):\n${JSON.stringify(chatGptMsgQueue)}`);
			chatGptMsgQueue = [];
		}

		this.utils.debugLogger(`chatGptMsgQueue 2:\n${JSON.stringify(chatGptMsgQueue)}`);


		let messages = [...chatGptMsgQueue];

		this.utils.debugLogger(`messages 1:\n${JSON.stringify(messages)}`);


		messages = this.utils.enqueue(messages, message, this.chatGptMsgQueueSize);

		this.utils.debugLogger(`messages 2:\n${JSON.stringify(messages)}`);



		const resRaw: AiTextResponse = await this.chatGptService.textRequest(userGuid, messages);

		if (
			resRaw.status !== AiResponseStatus.SUCCESS
			|| !resRaw?.payload
		) {
			this.logger.error(`User: ${userGuid}, ChatGPT error response (chatGptService.textRequest):\n${JSON.stringify(resRaw)}`);
		} else {

			/**
			 * Сохраняем пару "запрос:ответ" в кеше диалога с ChatGPT для сохранения контекста диалога
			 */

			const messagesWithResponse: IOpenAiChatMessage[] = [
				{
					role: OpenAiChatRoles.USER,
					content: prompt
				},
				{
					role: OpenAiChatRoles.ASSISTANT,
					content: resRaw.payload
				}
			];


			chatGptMsgQueue = this.utils.enqueue(chatGptMsgQueue, messagesWithResponse, this.chatGptMsgQueueSize);

			this.utils.debugLogger(`chatGptMsgQueue 3:\n${JSON.stringify(chatGptMsgQueue)}`);

			await this.utils.updateRedis(`${fromId}:${chatId}`, [], 'chatGptMsgQueue', chatGptMsgQueue);

			result.push({
				payload: resRaw.payload,
				finishReason: resRaw?.finishReason
			});
		}

		if (result.length === 0) {
			throw new Error(`None successful response received`);
		}

		return result;
	}

	// tslint:disable-next-line: max-line-length
	public async textStreamRequest(userGuid: string, chatId: number, fromId: number, prompt: string): Promise<AiTextResponsePayload> {

		const message: IOpenAiChatMessage = {
			role: OpenAiChatRoles.USER,
			content: prompt
		};

		let chatGptMsgQueue = await this.utils.getValRedis(`${fromId}:${chatId}`, ['chatGptMsgQueue']);

		this.utils.debugLogger(`chatGptMsgQueue 1:\n${JSON.stringify(chatGptMsgQueue)}`);

		if (!chatGptMsgQueue) {
			chatGptMsgQueue = [];
		}

		if (chatGptMsgQueue && !Array.isArray(chatGptMsgQueue)) {
			this.logger.error(`chatGptMsgQueue has wrong content (not array):\n${JSON.stringify(chatGptMsgQueue)}`);
			chatGptMsgQueue = [];
		}

		this.utils.debugLogger(`chatGptMsgQueue 2:\n${JSON.stringify(chatGptMsgQueue)}`);



		let messages = [...chatGptMsgQueue];

		this.utils.debugLogger(`messages 1:\n${JSON.stringify(messages)}`);


		messages = this.utils.enqueue(messages, message, this.chatGptMsgQueueSize);

		this.utils.debugLogger(`messages 2:\n${JSON.stringify(messages)}`);


		const resRaw: AiTextResponse = await this.chatGptService.textStreamRequest(userGuid, messages);

		if (
			resRaw.status !== AiResponseStatus.SUCCESS
			|| !resRaw?.payload
		) {
			throw new Error(`User: ${userGuid}, ChatGPT error response: ${resRaw.payload}`);
		} else {

			/**
			 * Сохраняем пару "запрос:ответ" в кеше диалога с ChatGPT для сохранения контекста диалога
			 */

			const messagesWithResponse: IOpenAiChatMessage[] = [
				{
					role: OpenAiChatRoles.USER,
					content: prompt
				},
				{
					role: OpenAiChatRoles.ASSISTANT,
					content: resRaw.payload
				}
			];


			chatGptMsgQueue = this.utils.enqueue(chatGptMsgQueue, messagesWithResponse, this.chatGptMsgQueueSize);

			this.utils.debugLogger(`chatGptMsgQueue 3:\n${JSON.stringify(chatGptMsgQueue)}`);


			await this.utils.updateRedis(`${fromId}:${chatId}`, [], 'chatGptMsgQueue', chatGptMsgQueue);

			return {
				payload: resRaw.payload,
				finishReason: resRaw?.finishReason
			};
		}
	}

	public async imgRequest(userGuid: string, prompt: string): Promise<AiImgResponsePayload> {
		// const resRaw: AiTextResponse = await this.mjService.imgRequest(user, prompt);

		// if (resRaw.status !== AiResponseStatus.SUCCESS) {
		// 	throw new Error('MidJourney error response');
		// } else {
		// 	return resRaw.payload;
		// }

		return [];
	}


}