import { App } from './app.class.js';
import { ChatGptCommunication } from './chatgpt/chatgpt.class.js';
import { UseLogger } from './logger/logger.class.js';

const hostname: string = process.env.PAPERTRAIL_HOSTNAME as string;
const program: string = process.env.PAPERTRAIL_PROGRAM as string;
const prompt: string = process.env.PROMPT as string;

const logger = new UseLogger();

const app = new App(
	logger,
	new ChatGptCommunication(logger)
);

app.init();
