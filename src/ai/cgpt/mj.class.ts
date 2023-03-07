import { IAI } from '../ai.interface.js';

export class MjService implements IAI {
	public async textRequest(str: string): Promise<string> {

		/**
		 * Mock API responce cases
		 */

		const sleep = async (milliseconds: number): Promise<unknown> => {
			return new Promise(resolve => setTimeout(resolve, milliseconds));
		};

		const dice: number = Math.floor(Math.random() * 10);
		const timeout = dice * 5000;

		if (dice >= 0 && dice < 2) {
			return `Response text with no delay\n\nrequest text: ${str}`;
		} else if (dice >= 2 && dice < 7) {
			/**
			 * Case of normal response within different time
			 */

			await sleep(timeout);

			return `Response text with ${timeout / 1000} sec. delay\n\nrequest text: ${str}`;
		} else {
			throw new Error('MjService error');
		}
	}

}