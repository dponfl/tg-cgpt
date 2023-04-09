export interface IOpenAI {
	sendTextRequest(prompt: string): Promise<string | void>;
}