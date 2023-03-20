import { Kysely } from 'kysely';
import { IAIImg, IAIText } from '../ai/ai.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IDatabase } from '../storage/mysql.interface.js';
import { IUtils } from '../utils/utils.class.js';
// tslint:disable-next-line: max-line-length
import { AiImgResponsePayload, AiOrchestratorResponse, AiResponseStatus, AiServices, AiTextResponse, AiTextResponsePayload, ControllerStatus, IMainController, RequestCategory } from './controller.interface.js';

export class MainController implements IMainController {

	constructor(
		private readonly logger: ILogger,
		private readonly utils: IUtils,
		private readonly chatGptService: IAIText,
		private readonly mjService: IAIImg,
		private readonly dbConnection: Kysely<IDatabase>,
	) { }

	// tslint:disable-next-line: max-line-length
	public async orchestrator<T>(userGuid: string, chatId: number, prompt: string, requestCategory: RequestCategory): Promise<T> {

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

					return result as T;
				}

				payload = await this.textRequest(userGuid, prompt);

				result = {
					status: ControllerStatus.SUCCESS,
					payload,
				};

				await this.updateUserRightsOnSuccessfulResponse(userGuid, AiServices.GTP);

				break;

			case RequestCategory.chatTextStream:

				result = await this.textStreamRequest(userGuid, prompt);

				break;

			default:
				const error = new Error(`Unknown requestCategory: ${requestCategory}`);
				this.utils.errorLog(this, error, methodName);
				throw error;
		}

		return result as T;
	}

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

					if (gptFreeLeft + gptLeft > 0) {
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

	public async textRequest(userGuid: string, prompt: string): Promise<AiTextResponsePayload[]> {

		const result: AiTextResponsePayload[] = [];

		/**
		 * Здесь может быть слелано несколько запросов к различным системат
		 */

		const resRaw: AiTextResponse = await this.chatGptService.textRequest(userGuid, prompt);

		if (
			resRaw.status !== AiResponseStatus.SUCCESS
			|| !resRaw?.payload
		) {
			this.logger.error(`User: ${userGuid}, ChatGPT error response (chatGptService.textRequest):\n${JSON.stringify(resRaw)}`);
		} else {
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

	public async textStreamRequest(userGuid: string, prompt: string): Promise<AiTextResponsePayload> {

		const resRaw: AiTextResponse = await this.chatGptService.textStreamRequest(userGuid, prompt);

		if (
			resRaw.status !== AiResponseStatus.SUCCESS
			|| !resRaw?.payload
		) {
			throw new Error(`User: ${userGuid}, ChatGPT error response: ${resRaw.payload}`);
		} else {
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