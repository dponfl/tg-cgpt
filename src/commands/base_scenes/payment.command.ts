import { Scenes } from 'telegraf';
import { ILogger } from '../../logger/logger.interface.js';
import { MySceneCommand } from './command.class.js';

export class PaymentCommand extends MySceneCommand {
	constructor(
		public readonly scene: Scenes.BaseScene,
		public readonly logger: ILogger,
	) {
		super(scene, logger);
	}
	public async handle(): Promise<void> {
		// tslint:disable-next-line: no-any
		this.scene.command('pay', async (ctx: any) => {
			await ctx.deleteMessage();
			await ctx.scene.enter('paymentScene');
		});
	}
}