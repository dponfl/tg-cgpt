import { BaseScene } from 'telegraf/scenes';
import { MySceneCommand } from './command.class.js';

export class MenuCommand extends MySceneCommand {
	constructor(
		public readonly scene: BaseScene,
	) {
		super(scene);
	}
	public async handle(): Promise<void> {
		this.scene.command('menu', async (ctx: any) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('menuScene');
		});
	}
}