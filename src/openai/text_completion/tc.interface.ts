export interface IOpenAI {
	checkCredentials(): void;
	sendTextRequest(prompt: string): Promise<string | void>;
}