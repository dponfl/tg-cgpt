import { AiImgResponse, AiTextResponse } from '../controller/controller.interface.js';
import { IOpenAiChatMessage } from './open_ai/chat.interface.js';

export interface IAIText {
	textRequest: (user: string, messages: IOpenAiChatMessage[]) => Promise<AiTextResponse>;
	textStreamRequest: (user: string, messages: IOpenAiChatMessage[]) => Promise<AiTextResponse>;
}

export interface IAIImg {
	imgRequest: (user: string, prompt: string) => Promise<AiImgResponse>;
}
