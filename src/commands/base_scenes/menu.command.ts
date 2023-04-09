import { Scenes } from 'telegraf';
import { ILogger } from '../../logger/logger.interface.js';
import { MySceneCommand } from './command.class.js';

export class MenuCommand extends MySceneCommand {
	constructor(
		public readonly scene: Scenes.BaseScene,
		public readonly logger: ILogger,
	) {
		super(scene, logger);
	}
	public async handle(): Promise<void> {
		// tslint:disable-next-line: no-any
		this.scene.command('menu', async (ctx: any) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('menuScene');
		});
	}
}