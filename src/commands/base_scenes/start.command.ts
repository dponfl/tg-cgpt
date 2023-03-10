import { BaseScene } from 'telegraf/scenes';
import { ILogger } from '../../logger/logger.interface.js';
import { IUtils } from '../../utils/utils.class.js';
import { MySceneCommand } from './command.class.js';

export class StartCommand extends MySceneCommand {
	constructor(
		public readonly scene: BaseScene,
		public readonly logger: ILogger,
		public readonly utils?: IUtils
	) {
		super(scene, logger);
	}
	public async handle(): Promise<void> {
		// tslint:disable-next-line: no-any
		this.scene.command('start', async (ctx: any) => {
			await ctx.deleteMessage();
			if (!ctx.session.botUserSession.userGuid) {
				this.logger.error(`Error: [${this.utils?.getChatIdStr(ctx)}] No value at ctx.session.botUserSession.userGuid`);
			}
			await ctx.scene.enter('startNext');
		});
	}
}