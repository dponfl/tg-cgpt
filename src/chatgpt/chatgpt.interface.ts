export interface IChatGpt {
	checkCredentials(): void;
	sendTextRequest(prompt: string): Promise<string | void>;
}