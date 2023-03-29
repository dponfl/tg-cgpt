import { Scenes } from 'telegraf';
import { ILogger } from '../../logger/logger.interface.js';
import { ISessionService } from '../../storage/session.interface.js';
import { IUtils } from '../../utils/utils.class.js';
import { MySceneCommand } from './command.class.js';

export class StartCommand extends MySceneCommand {
	constructor(
		public readonly scene: Scenes.BaseScene,
		public readonly logger: ILogger,
		public readonly utils?: IUtils,
		public readonly sessionService?: ISessionService
	) {
		super(scene, logger);
	}
	public async handle(): Promise<void> {
		// tslint:disable-next-line: no-any
		this.scene.command('start', async (ctx: any) => {
			await ctx.deleteMessage();

			/**
 * Очищаем значения переменных, связанных с чатом
 */

			let chatVarsUpdated = false;

			if (ctx.session.botUserSession.pendingChatGptRequest) {
				ctx.session.botUserSession.pendingChatGptRequest = false;
				chatVarsUpdated = true;
			}

			if (ctx.session.botUserSession.textRequest) {
				ctx.session.botUserSession.textRequest = '';
				chatVarsUpdated = true;
			}

			if (ctx.session.botUserSession.textRequestMessageId) {
				ctx.session.botUserSession.textRequestMessageId = 0;
				chatVarsUpdated = true;
			}

			if (chatVarsUpdated) {
				this.sessionService?.updateSession(ctx);
			}

			if (!ctx.session.botUserSession.userGuid) {
				this.logger.error(`Error: [${this.utils?.getChatIdStr(ctx)}] No value at ctx.session.botUserSession.userGuid`);
			}
			await ctx.scene.enter('startNext');
		});
	}
}