import { AiImgRequest, AiImgResponse, AiTextRequest, AiTextResponse } from '../controller/controller.interface.js';

export interface IAIText {
	textRequest(str: AiTextRequest): Promise<AiTextResponse>;
}

export interface IAIImg {
	imgRequest(str: AiImgRequest): Promise<AiImgResponse>;
}
