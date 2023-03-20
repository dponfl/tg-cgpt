export enum AiResponseStatus {
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR',
}

export enum ControllerStatus {
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR',
	ACTION_PAYMENT = 'ACTION_PAYMENT',
}

export enum AiServices {
	GTP = 'gtp',
	MJ = 'mj',
}

export enum OpenAiChatFinishReason {
	stop = 'stop', // API returned complete model output
	length = 'length', // Incomplete model output due to max_tokens parameter or token limit
	content_filter = 'content_filter', // Omitted content due to a flag from our content filters
	null = 'null', // API response still in progress or incomplete
}

export enum RequestCategory {
	chatText = 'chatText',
	chatTextStream = 'chatTextStream',
}

export type AiTextRequest = {
	text: string;
};

export type AiImgRequest = {
	text: string;
};

export type AiTextResponsePayload = {
	payload: string;
	finishReason?: OpenAiChatFinishReason | string | null;
};

export type AiImgResponsePayload = string[] | undefined;

export type AiTextResponse = {
	status: AiResponseStatus;
	finishReason?: OpenAiChatFinishReason | string | null;
	payload?: string;
};

export type AiImgResponse = {
	status: AiResponseStatus;
	payload?: AiImgResponsePayload;
};

export type AiOrchestratorResponse<T> = {
	status: ControllerStatus;
	payload: T;
};

export interface IMainController {
	// tslint:disable-next-line: max-line-length
	orchestrator: <T>(user: string, chatId: number, prompt: string, requestCategory: RequestCategory) => Promise<AiOrchestratorResponse<T>>;
	textRequest: (user: string, prompt: string) => Promise<AiTextResponsePayload[]>;
	textStreamRequest: (user: string, prompt: string) => Promise<AiTextResponsePayload>;
	imgRequest: (user: string, prompt: string) => Promise<AiImgResponsePayload>;
}
