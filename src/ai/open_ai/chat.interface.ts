import { CreateChatCompletionRequest } from 'openai';

export enum OpenAiChatModels {
	GPT_3_5 = 'gpt-3.5-turbo',
}

export enum OpenAiChatRoles {
	SYSTEM = 'system',
	USER = 'user',
	ASSISTANT = 'assistant',
}

export interface IOpenAiChatMessage {
	role: OpenAiChatRoles;
	content: string;
}

export interface IChatRequestParams extends CreateChatCompletionRequest {
	model: OpenAiChatModels;
}

