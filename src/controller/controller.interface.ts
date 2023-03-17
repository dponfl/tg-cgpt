export enum AiResponseStatus {
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR'
}

export type AiTextRequest = {
	text: string;
};

export type AiImgRequest = {
	text: string;
};

export type AiTextResponsePayload = string[] | undefined;

export type AiImgResponsePayload = string[] | undefined;

export type AiTextResponse = {
	status: AiResponseStatus;
	payload?: AiTextResponsePayload;
};

export type AiImgResponse = {
	status: AiResponseStatus;
	payload?: AiImgResponsePayload;
};

export interface IMainController {
	openAiChatRequest(prompt: string): Promise<AiTextResponsePayload>;
	mjImgRequest(prompt: string): Promise<AiImgResponsePayload>;
}
