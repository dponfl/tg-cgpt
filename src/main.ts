import { App } from './app.class.js';
import { OpenAICommunication } from './openai/text_completion/tc.class.js';
import { UseLogger } from './logger/logger.class.js';
import { ConfigService } from './config/config.service.js';
import { IConfigService } from './config/config.interface.js';
import { ILogger } from './logger/logger.interface.js';

const bootstap = async () => {


	const logger: ILogger = new UseLogger();
	const configService: IConfigService = new ConfigService(logger);

	const app = new App(
		logger,
		new OpenAICommunication(logger, configService),
		configService
	);

	await app.init();

};

bootstap();