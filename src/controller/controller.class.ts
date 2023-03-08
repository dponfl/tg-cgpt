import { IAIImg, IAIText } from '../ai/ai.interface.js';
import { ILogger } from '../logger/logger.interface.js';
// tslint:disable-next-line: max-line-length
import { AiImgRequest, AiImgResponsePayload, AiResponseStatus, AiTextRequest, AiTextResponse, AiTextResponsePayload, IMainController } from './controller.interface.js';

export class MainController implements IMainController {

	constructor(
		private readonly logger: ILogger,
		private readonly chatGptService: IAIText,
		private readonly mjService: IAIImg
	) { }

	public async cgptTextRequest(str: AiTextRequest): Promise<AiTextResponsePayload> {

		const resRaw: AiTextResponse = await this.chatGptService.textRequest(str);

		if (resRaw.status !== AiResponseStatus.SUCCESS) {
			throw new Error('ChatGPT error response');
		} else {
			return resRaw.payload;
		}
	}

	public async mjImgRequest(str: AiImgRequest): Promise<AiImgResponsePayload> {
		const resRaw: AiTextResponse = await this.mjService.imgRequest(str);

		if (resRaw.status !== AiResponseStatus.SUCCESS) {
			throw new Error('MidJourney error response');
		} else {
			return resRaw.payload;
		}
	}


}