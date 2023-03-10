import { BaseScene } from 'telegraf/scenes';
import { ILogger } from '../../logger/logger.interface.js';
import { IUtils } from '../../utils/utils.class.js';

export abstract class MySceneCommand {
	constructor(
		public readonly scene: BaseScene | unknown,
		public readonly logger?: ILogger,
		public readonly utils?: IUtils
	) { }
	abstract handle(): Promise<void>;
}