import { BaseScene } from 'telegraf/scenes';

export abstract class MySceneCommand {
	constructor(
		public readonly scene: BaseScene | unknown,
	) { }
	abstract handle(): Promise<void>;
}