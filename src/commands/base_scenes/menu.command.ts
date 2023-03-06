import { BaseScene } from 'telegraf/scenes';
import { ILogger } from '../../logger/logger.interface.js';
import { MySceneCommand } from './command.class.js';

export class MenuCommand extends MySceneCommand {
	constructor(
		public readonly scene: BaseScene,
		public readonly logger: ILogger
	) {
		super(scene, logger);
	}
	public async handle(): Promise<void> {
		this.scene.command('menu', async (ctx: any) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('menuScene');
		});
	}
}