import { ILogger } from './logger/logger.interface.js';
import { IMainController } from './controller/controller.interface.js';

export class App {

	private prompt: string = '';

	constructor(
		private readonly logger: ILogger,
		private readonly mainController: IMainController
	) { }

	public async init(): Promise<void> {

		this.logger.info('App.init() started');

		this.mainController.run();

	}
}