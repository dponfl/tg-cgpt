import { BaseScene } from 'telegraf/scenes';
import { ISceneGenerator } from './scenes.interface.js';

export class ScenesGenerator implements ISceneGenerator {

	public async getBaseScenes(): Promise<unknown[]> {

		return Promise.all([
			this.intro(),
			this.introTwo()
		]);
	}

	public async getWizardScenes(): Promise<unknown[]> {
		return [];
	}

	/**
	 * Base scenes
	 */

	private async intro(): Promise<unknown> {
		const intro = new BaseScene('intro');

		intro.enter(async (ctx: any) => {
			await ctx.replyWithHTML(`Hi! You've entered 'into' scene`);
			await ctx.scene.enter('introTwo');

		});


		return intro;
	}

	private async introTwo(): Promise<unknown> {
		const introTwo = new BaseScene('introTwo');

		introTwo.enter(async (ctx: any) => {
			await ctx.replyWithHTML(`Hi! You've entered 'introTwo' scene`);
			await ctx.scene.leave();

		});


		return introTwo;
	}

	/**
	 * Wizard scenes
	 */

}