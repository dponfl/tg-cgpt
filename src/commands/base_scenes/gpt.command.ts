import { BaseScene } from 'telegraf/scenes';
import { ILogger } from '../../logger/logger.interface.js';
import { MySceneCommand } from './command.class.js';

export class GptCommand extends MySceneCommand {
	constructor(
		public readonly scene: BaseScene,
		public readonly logger: ILogger,
	) {
		super(scene, logger);
	}
	public async handle(): Promise<void> {
		// tslint:disable-next-line: no-any
		this.scene.command('gpt', async (ctx: any) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('mainGptScene');
		});
	}
}