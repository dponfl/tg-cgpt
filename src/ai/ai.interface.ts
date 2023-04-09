import { AiImgResponse, AiTextResponse } from '../controller/controller.interface.js';
import { IOpenAiChatMessage } from './open_ai/chat.interface.js';

export interface IAIText {
	textRequest: (userGuid: string, messages: IOpenAiChatMessage[]) => Promise<AiTextResponse>;
	textStreamRequest: (userGuid: string, messages: IOpenAiChatMessage[]) => Promise<AiTextResponse>;
}

export interface IAIImg {
	imgRequest: (userGuid: string, prompt: string) => Promise<AiImgResponse>;
}
