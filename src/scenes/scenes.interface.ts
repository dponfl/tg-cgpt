import { BaseScene } from 'telegraf/scenes';

export interface ISceneGenerator {
	getScenes(): Promise<BaseScene[] | unknown[]>
}