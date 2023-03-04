export interface ISceneGenerator {
	getBaseScenes(): Promise<any[]>;
	getWizardScenes(): Promise<any[]>;
}