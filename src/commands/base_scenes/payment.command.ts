import { BaseScene } from 'telegraf/scenes';
import { MySceneCommand } from './command.class.js';

export class PaymentCommand extends MySceneCommand {
	constructor(
		public readonly scene: BaseScene,
	) {
		super(scene);
	}
	public async handle(): Promise<void> {
		this.scene.command('pay', async (ctx: any) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('paymentScene');
		});
	}
}