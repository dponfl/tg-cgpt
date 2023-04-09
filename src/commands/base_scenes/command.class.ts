import { Scenes } from 'telegraf';
import { ILogger } from '../../logger/logger.interface.js';
import { ISessionService } from '../../storage/session.interface.js';
import { IUtils } from '../../utils/utils.class.js';

export abstract class MySceneCommand {
	constructor(
		public readonly scene: Scenes.BaseScene | unknown,
		public readonly logger?: ILogger,
		public readonly utils?: IUtils,
		public readonly sessionService?: ISessionService
	) { }
	abstract handle(): Promise<void>;
}