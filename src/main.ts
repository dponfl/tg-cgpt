import { exit } from 'process';
import { App } from './app.class.js';
import { OpenAICommunication } from './openai/text_completion/tc.class.js';
import { UseLogger } from './logger/logger.class.js';

const bootstap = async () => {

	const hostname: string = process.env.PAPERTRAIL_HOSTNAME as string;
	const program: string = process.env.PAPERTRAIL_PROGRAM as string;
	const prompt: string = process.env.PROMPT as string;

	const logger = new UseLogger();

	const app = new App(
		logger,
		new OpenAICommunication(logger)
	);

	await app.init();

};

bootstap();