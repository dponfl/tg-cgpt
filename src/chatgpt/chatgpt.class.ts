import { IChatGpt } from './chatgpt.interface.js';

export class ChatGptCommunication implements IChatGpt {

	constructor() { }

	sendTextRequest(prompt: string): string {
		throw new Error('Method not implemented.');
	}

}