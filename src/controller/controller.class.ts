import { IAIImg, IAIText } from '../ai/ai.interface.js';
import { ILogger } from '../logger/logger.interface.js';
// tslint:disable-next-line: max-line-length
import { AiImgResponsePayload, AiResponseStatus, AiTextResponse, AiTextResponsePayload, IMainController } from './controller.interface.js';

export class MainController implements IMainController {

	constructor(
		private readonly logger: ILogger,
		private readonly chatGptService: IAIText,
		private readonly mjService: IAIImg
	) { }

	public async textRequest(user: string, prompt: string): Promise<AiTextResponsePayload> {

		const resPayload: string[] = [];

		const resRaw: AiTextResponse = await this.chatGptService.textRequest(user, prompt);

		const resStreamRaw: AiTextResponse = await this.chatGptService.textStreamRequest(user, prompt);

		if (resRaw.status !== AiResponseStatus.SUCCESS) {
			throw new Error('ChatGPT error response');
		} else if (resRaw.payload) {
			resPayload.push(resRaw.payload[0]);
		} else {
			this.logger.error(`User: ${user}, resRaw.payload is undefined`)
		}

		if (resStreamRaw.status !== AiResponseStatus.SUCCESS) {
			throw new Error('ChatGPT (stream) error response');
		} else if (resStreamRaw.payload) {
			resPayload.push(resStreamRaw.payload[0]);
		} else {
			this.logger.error(`User: ${user}, resStreamRaw.payload is undefined`)
		}

		return resPayload;

	}

	public async imgRequest(user: string, prompt: string): Promise<AiImgResponsePayload> {
		const resRaw: AiTextResponse = await this.mjService.imgRequest(user, prompt);

		if (resRaw.status !== AiResponseStatus.SUCCESS) {
			throw new Error('MidJourney error response');
		} else {
			return resRaw.payload;
		}
	}


}