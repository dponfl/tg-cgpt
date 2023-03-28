import { AiImgResponse } from '../../controller/controller.interface.js';
import { IAIImg } from '../ai.interface.js';

export interface IMjService extends IAIImg {
	imgRequest: (userGuid: string, prompt: string) => Promise<AiImgResponse>;
}