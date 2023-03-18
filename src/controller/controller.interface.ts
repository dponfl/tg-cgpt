export enum AiResponseStatus {
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR'
}

export enum OpenAiChatFinishReason {
	stop = 'stop', // API returned complete model output
	length = 'length', // Incomplete model output due to max_tokens parameter or token limit
	content_filter = 'content_filter', // Omitted content due to a flag from our content filters
	null = 'null', // API response still in progress or incomplete
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
	finishReason?: OpenAiChatFinishReason | string | null;
	payload?: AiTextResponsePayload;
};

export type AiImgResponse = {
	status: AiResponseStatus;
	payload?: AiImgResponsePayload;
};

export interface IMainController {
	textRequest(user: string, prompt: string): Promise<AiTextResponsePayload>;
	imgRequest(user: string, prompt: string): Promise<AiImgResponsePayload>;
}
