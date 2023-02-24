export interface IChatGpt {
	sendTextRequest(prompt: string): string;
}