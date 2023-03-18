import { AiImgResponse, AiTextResponse } from '../controller/controller.interface.js';

export interface IAIText {
	textRequest: (user: string, prompt: string) => Promise<AiTextResponse | void>;
	textStreamRequest: (user: string, prompt: string) => Promise<AiTextResponse | void>;
}

export interface IAIImg {
	imgRequest: (user: string, prompt: string) => Promise<AiImgResponse>;
}
