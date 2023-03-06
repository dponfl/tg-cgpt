import { BaseScene } from 'telegraf/scenes';

export abstract class MySceneCommand {
	constructor(
		public readonly scene: BaseScene,
	) { }
	abstract handle(): Promise<void>;
}