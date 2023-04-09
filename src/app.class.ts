import { ILogger } from './logger/logger.interface.js';
import { IBotContext, IBotService } from './bot/bot.interface.js';
import { Telegraf } from 'telegraf';
import express, { Express } from 'express';
import { Server } from 'http';
import { PaymentProcessingController } from './api/payment.controller.js';
import { IConfigService } from './config/config.interface.js';
import bodyParser from 'body-parser';


export class App {

	private bot: Telegraf<IBotContext> = <Telegraf<IBotContext>>{};
	private app: Express;
	private server: Server | undefined;
	private port: number;


	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		private readonly botService: IBotService,
		private readonly paymentProcessingController: PaymentProcessingController
	) {
		this.app = express();
		this.port = Number(configService.get('PORT'));

	}

	private useRoutes() {
		this.app.use('/payment', this.paymentProcessingController.router);
	}

	public async initBot(): Promise<void> {

		this.bot = await this.botService.init();

		/**
		 * default error handler
		 */

		this.bot.catch(async (error: unknown, ctx) => {

			this.logger.error(`Bot error: ${error}`);

			await ctx.reply('При обработке вашего сообщения что-то пошло не так.');
		});

		this.bot.launch();

		this.logger.info('App.init() started');

	}

	public async initApi(): Promise<void> {
		this.app.use(bodyParser.json());
		this.useRoutes();
		this.server = this.app.listen(this.port);
		this.logger.info(`Express server launched at port=${this.port}`);
	}
}