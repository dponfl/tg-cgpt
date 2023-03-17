import { AiImgResponse, AiTextResponse } from '../controller/controller.interface.js';

export interface IAIText {
	textRequest: (prompt: string) => Promise<AiTextResponse>;
}

export interface IAIImg {
	imgRequest: (str: string) => Promise<AiImgResponse>;
}
