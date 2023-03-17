import { AiResponseStatus, AiTextRequest, AiTextResponse } from '../../controller/controller.interface.js';
import { IAIText } from '../ai.interface.js';

export class ChatGPTService implements IAIText {
	public async textRequest(str: string): Promise<AiTextResponse> {

		/**
		 * Mock API responce cases
		 */

		const sleep = async (milliseconds: number): Promise<unknown> => {
			return new Promise(resolve => setTimeout(resolve, milliseconds));
		};

		const dice: number = Math.floor(Math.random() * 10);
		const timeout = dice * 5000;

		if (dice >= 0 && dice < 2) {
			return {
				status: AiResponseStatus.SUCCESS,
				payload: [`Response text with no delay. Request text: ${str}`]
			};
		} else if (dice >= 2 && dice < 7) {
			/**
			 * Case of normal response within different time
			 */

			await sleep(timeout);

			return {
				status: AiResponseStatus.SUCCESS,
				payload: [`Response text with ${timeout / 1000} sec. delay`, `Request text: ${str}`]
			};
		} else {
			return {
				status: AiResponseStatus.ERROR,
				payload: ['ChatGPTService error']
			};
		}
	}

}