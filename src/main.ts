import { App } from './app.class.js';
import { BotService } from './bot/bot.class.js';
import { IConfigService } from './config/config.interface.js';
import { ConfigService } from './config/config.service.js';
import { MainController } from './controller/controller.class.js';
import { UseLogger } from './logger/logger.class.js';
import { ILogger } from './logger/logger.interface.js';
import { OpenAICommunication } from './openai/text_completion/tc.class.js';

const bootstap = async () => {


	const logger: ILogger = new UseLogger();
	const configService: IConfigService = new ConfigService(logger);

	const app = new App(
		logger,
		new MainController(
			logger,
			configService,
			new BotService(logger, configService),
			new OpenAICommunication(logger, configService)
		)
	);

	await app.init();

};

bootstap();