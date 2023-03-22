import { BaseScene } from 'telegraf/scenes';
import { ILogger } from '../../logger/logger.interface.js';
import { IUtils } from '../../utils/utils.class.js';
import { MySceneCommand } from './command.class.js';

export class DropContextCommand extends MySceneCommand {
	constructor(
		public readonly scene: BaseScene,
		public readonly logger: ILogger,
		public readonly utils: IUtils
	) {
		super(scene, logger, utils);
	}
	public async handle(): Promise<void> {
		// tslint:disable-next-line: no-any
		this.scene.command('dropcontext', async (ctx: any) => {

			const txt =
				`
			Контекст сброшен ✅
			`;

			const { chatId, fromId } = this.utils.getChatIdObj(ctx);

			this.logger.info(`Command /dropcontext by chatId=${chatId} and fromId=${fromId}`);

			if (chatId && fromId) {

				await this.utils.dropcontext(chatId, fromId);
				await ctx.replyWithHTML(txt);
			}
		});
	}
}