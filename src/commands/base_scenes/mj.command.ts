import { BaseScene } from 'telegraf/scenes';
import { MySceneCommand } from './command.class.js';

export class MjCommand extends MySceneCommand {
	constructor(
		public readonly scene: BaseScene,
	) {
		super(scene);
	}
	public async handle(): Promise<void> {
		this.scene.command('img', async (ctx: any) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('mainMJScene');
		});
	}
}