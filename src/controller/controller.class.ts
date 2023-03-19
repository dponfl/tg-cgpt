import { IAIImg, IAIText } from '../ai/ai.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
// tslint:disable-next-line: max-line-length
import { AiImgResponsePayload, AiOrchestratorResponse, AiResponseStatus, AiTextResponse, AiTextResponsePayload, IMainController, RequestCategory } from './controller.interface.js';

export class MainController implements IMainController {

	constructor(
		private readonly logger: ILogger,
		private readonly utils: IUtils,
		private readonly chatGptService: IAIText,
		private readonly mjService: IAIImg
	) { }

	// tslint:disable-next-line: max-line-length
	public async orchestrator(user: string, chatId: number, prompt: string, requestCategory: RequestCategory): Promise<AiOrchestratorResponse> {

		const methodName = 'orchestrator';

		let result: AiOrchestratorResponse;

		switch (requestCategory) {
			case RequestCategory.chatText:
				result = await this.textRequest(user, prompt);
				break;
			case RequestCategory.chatTextStream:
				result = await this.textStreamRequest(user, prompt);
				break;
			default:
				const error = new Error(`Unknown requestCategory: ${requestCategory}`);
				this.utils.errorLog(this, error, methodName);
				throw error;
		}

		return result;
	}

	public async textRequest(user: string, prompt: string): Promise<AiTextResponsePayload[]> {

		const result: AiTextResponsePayload[] = [];

		/**
		 * Здесь может быть слелано несколько запросов к различным системат
		 */

		const resRaw: AiTextResponse = await this.chatGptService.textRequest(user, prompt);

		if (
			resRaw.status !== AiResponseStatus.SUCCESS
			|| !resRaw?.payload
		) {
			this.logger.error(`User: ${user}, ChatGPT error response: ${resRaw.payload}`);
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

	public async textStreamRequest(user: string, prompt: string): Promise<AiTextResponsePayload> {

		const resRaw: AiTextResponse = await this.chatGptService.textStreamRequest(user, prompt);

		if (
			resRaw.status !== AiResponseStatus.SUCCESS
			|| !resRaw?.payload
		) {
			throw new Error(`User: ${user}, ChatGPT error response: ${resRaw.payload}`);
		} else {
			return {
				payload: resRaw.payload,
				finishReason: resRaw?.finishReason
			};
		}
	}

	public async imgRequest(user: string, prompt: string): Promise<AiImgResponsePayload> {
		// const resRaw: AiTextResponse = await this.mjService.imgRequest(user, prompt);

		// if (resRaw.status !== AiResponseStatus.SUCCESS) {
		// 	throw new Error('MidJourney error response');
		// } else {
		// 	return resRaw.payload;
		// }

		return [];
	}


}