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
	textRequest(prompt: string): Promise<AiTextResponsePayload>;
	imgRequest(prompt: string): Promise<AiImgResponsePayload>;
}
