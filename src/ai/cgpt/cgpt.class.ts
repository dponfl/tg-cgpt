import { IAI } from '../ai.interface.js';

export class ChatGPTService implements IAI {
	public async textRequest(str: string): Promise<string> {

		/**
		 * Mock API responce cases
		 */

		const sleep = async (milliseconds: number): Promise<unknown> => {
			return new Promise(resolve => setTimeout(resolve, milliseconds));
		};

		const dice: number = Math.floor(Math.random() * 10);

		if (dice > 0 && dice < 7) {
			/**
			 * Case of normal response within different time
			 */

			await sleep(dice * 1000);

			return `Response text with ${dice} sec. delay`;
		} else {
			return 'Response text with no delay';
		}
	}

}