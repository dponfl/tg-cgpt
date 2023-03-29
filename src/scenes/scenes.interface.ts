import { Scenes } from 'telegraf';

export interface ISceneGenerator {
	getScenes(): Promise<Scenes.BaseScene[] | unknown[]>
}