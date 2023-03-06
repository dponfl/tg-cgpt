import { BaseScene } from 'telegraf/scenes';
import { ILogger } from '../../logger/logger.interface.js';

export abstract class MySceneCommand {
	constructor(
		public readonly scene: BaseScene,
		public readonly logger: ILogger
	) { }
	abstract handle(): Promise<void>;
}