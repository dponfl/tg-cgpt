import { AiImgResponse, AiTextResponse } from '../controller/controller.interface.js';

export interface IAIText {
	textRequest: (user: string, prompt: string) => Promise<AiTextResponse>;
}

export interface IAIImg {
	imgRequest: (user: string, prompt: string) => Promise<AiImgResponse>;
}
