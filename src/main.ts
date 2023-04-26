import { IAIImg, IAIText } from './ai/ai.interface.js';
import { App } from './app.class.js';
import { BotService } from './bot/bot.class.js';
import { IConfigService } from './config/config.interface.js';
import { ConfigService } from './config/config.service.js';
import { MainController } from './controller/controller.class.js';
import { IMainController } from './controller/controller.interface.js';
import { UseLogger } from './logger/logger.class.js';
import { ILogger } from './logger/logger.interface.js';
import { ScenesGenerator } from './scenes/scenes.class.js';
import { ISceneGenerator } from './scenes/scenes.interface.js';
import RedisSession from 'telegraf-session-redis-upd';
import { SessionService } from './storage/session.class.js';
import { Kysely, MysqlDialect } from 'kysely';
import { IDatabase, IDbServices } from './storage/mysql.interface.js';
import { createPool } from 'mysql2';
import { UsersStorageService } from './storage/users.class.js';
import { IUtils, Utils } from './utils/utils.class.js';
import { BroadcastService } from './broadcast/bc.service.js';
import { IHttpService } from './http/http.interface.js';
import { HttpService } from './http/http.class.js';
import { exit } from 'process';
import { RobokassaService } from './payments/robokassa.class.js';
import { IPaymentProcessingService, IPaymentService } from './payments/payments.interface.js';
import { GtStorageService } from './storage/gt.class.js';
import { PaymentProcessingController } from './api/payment.controller.js';
import { PaymentService } from './payments/payment.class.js';
import { Redis } from 'ioredis';
import { OpenAiChatService } from './ai/open_ai/chat.service.js';
import { ServiceUsageStorageService } from './storage/service.class.js';
import { RequestStorageService } from './storage/request.class.js';
import { MjService } from './ai/mj/mj.service.js';
import { IDiscordService } from './discord/discord.interface.js';
import { DiscordService } from './discord/discord.service.js';
import { EnlargeType, IMidjourneyService, VariationType } from './midjourney/midjourney.interface.js';
import { MidjourneyService } from './midjourney/midjourney,service.js';

const bootstap = async () => {


	const configService: IConfigService = new ConfigService();
	const logger: ILogger = new UseLogger(configService);


	const redisSession: RedisSession = new RedisSession({
		store: {
			host: configService.get('REDIS_HOST'),
			port: configService.get('REDIS_PORT'),
			url: configService.get('REDIS_URL')
		}
	});
	const redis: Redis = new Redis(configService.get('REDIS_URL'));

	const sessionService = new SessionService(redisSession);

	const dbConnection: Kysely<IDatabase> = new Kysely<IDatabase>({
		dialect: new MysqlDialect({
			pool: createPool({
				host: configService.get('DB_HOST'),
				user: configService.get('DB_USER'),
				password: configService.get('DB_PW'),
				database: configService.get('DB_NAME'),
			})
		})
	});

	const utils: IUtils = new Utils(logger, dbConnection, redis);

	const dbServices: IDbServices = {
		usersDbService: new UsersStorageService(dbConnection, logger, utils),
		gtDbService: new GtStorageService(dbConnection, logger, utils),
		serviceUsageDbService: new ServiceUsageStorageService(dbConnection, logger, configService, utils),
		requestsDbService: new RequestStorageService(dbConnection, logger, utils)
	};

	const discordService: IDiscordService = new DiscordService(
		logger,
		configService,
		utils
	);

	const midjourneyService: IMidjourneyService = new MidjourneyService(
		logger,
		configService,
		utils,
		discordService
	);

	const chatOpenAiService: IAIText = new OpenAiChatService(
		logger,
		configService,
		dbServices,
		utils
	);

	const mjService: IAIImg = new MjService(
		logger,
		configService,
		dbServices,
		utils
	);

	const mainController: IMainController = new MainController(
		configService,
		logger,
		utils,
		chatOpenAiService,
		mjService,
		dbConnection,
		dbServices
	);


	const broadcastService = new BroadcastService(logger, dbServices, utils);

	const httpService: IHttpService = new HttpService(logger, utils);

	// tslint:disable-next-line: max-line-length
	const robokassaService: IPaymentService = new RobokassaService(configService, logger, utils, httpService, dbConnection);

	const scenesGenerator: ISceneGenerator = new ScenesGenerator(
		logger,
		configService,
		mainController,
		sessionService,
		utils,
		dbConnection,
		robokassaService
	);

	const botService = new BotService(
		logger,
		configService,
		scenesGenerator,
		redisSession,
		dbConnection,
		dbServices,
		sessionService,
		utils,
		broadcastService
	);

	const paymentProcessingService: IPaymentProcessingService = new PaymentService(
		logger,
		utils,
		dbConnection,
		botService
	);


	const paymentProcessingController: PaymentProcessingController = new PaymentProcessingController(
		logger,
		paymentProcessingService,
		robokassaService
	);



	const app = new App(
		logger,
		configService,
		botService,
		paymentProcessingController
	);

	/**
	 * IIF to test certain functionality
	 */

	(async () => {

		// const payload = {
		// 	a: 1,
		// 	t: 'some text'
		// };

		// const options: IHttpPostRequestOptions = {
		// 	body: JSON.stringify(payload),
		// 	method: HttpRequestMethod.POST,
		// 	dataFormat: HttpDataFormat.json,
		// };

		// const params: IHttpRequest = {
		// 	url: 'https://httpbin.org/post',
		// 	options,
		// };
		// const res = await httpService.post(params);

		// logger.info(`Res: ${JSON.stringify(res, null, 2)}`);


		/**
		 * Check Robokassa
		 */

		// const robokassaService = new RobokassaService(configService, logger, utils, httpService, dbConnection);

		// const paramsRobokassa: IGetPaymentLinkParams = {
		// 	amount: 150,
		// 	currency: GroupTransactionCurrency.RUB,
		// 	description: 'Подписка на GPT сервис (10 запросов)',
		// 	uid: '8f149f57-9f04-4bff-b34a-781dc6439bec',
		// 	serviceName: GroupTransactionServiceName.GPT,
		// 	purchasedQty: '10'
		// };
		// const result = await robokassaService.getPaymentLink(paramsRobokassa);

		// logger.info(`Result: ${JSON.stringify(result, null, 2)}`);

		// exit;

		// const sessionRec = await redis.get('372204823:372204823');
		// if (sessionRec) {
		// 	const sessionRecJson = JSON.parse(sessionRec);
		// 	logger.info(`Redis session data:\n${sessionRec}`);
		// 	const str = JSON.stringify(sessionRecJson);
		// 	logger.info(`Redis session data (json 1):\n${str}`);
		// 	logger.info(`Redis session data (json 2):\n${sessionRecJson}`);
		// }

		/**
		 * Check created redis methods
		 */

		// const obj = {
		// 	key01: {
		// 		key01_01: 'some string',
		// 		key01_02: 123,
		// 		key01_03: {
		// 			key01_03_01: 'some another string'
		// 		}
		// 	},
		// 	key02: {
		// 		key02_01: 'text'
		// 	}
		// };

		// await redis.set('test', JSON.stringify(obj));

		// await utils.updateRedis('test', ['key02'], 'newKey', 321);
		// const res = await utils.updateRedis('test', ['key01', 'key01_03'], 'anotherNewKey', {
		// 	key01_AnotherNewKey: 111,
		// 	key02_AnotherNewKey: 'string',
		// 	key03_AnotherNewKey: {
		// 		key: 'value'
		// 	}
		// });

		// const res = await utils.updateRedis('test', [], 'key03',
		// 	{
		// 		key03_01: 'text',
		// 		key03_02: 123,
		// 		key03_03: {
		// 			add: 'Hello World'
		// 		}
		// 	});

		// const res = await utils.updateRedis('test', ['key02'], 'testKey', 'testValue');
		// const res2 = await utils.getValRedis('test', ['key01', 'key01_03']);
		// const res3 = await utils.getValRedis('test', ['key01']);
		// const res4 = await utils.getValRedis('test', []);

		// logger.info(`res:\n${JSON.stringify(res)}`);
		// logger.info(`res2:\n${JSON.stringify(res2)}`);
		// logger.info(`res3:\n${JSON.stringify(res3)}`);
		// logger.info(`res4:\n${JSON.stringify(res4)}`);

		// const prompt = 'Кто ты?';
		// const res = await mainController.openAiChatRequest(prompt);
		// logger.info(`mainController.openAiChatRequest:\n${JSON.stringify(res)}`);

		// const oldElem = await utils.getValRedis('test', ['key01']);
		// logger.info(`key01:\n${JSON.stringify(oldElem)}`);
		// const newElem = await utils.getValRedis('test', ['msgChatGpt']);
		// logger.info(`msgChatGpt:\n${newElem}`);

		// exit;

		// const size = 3;
		// let arr: unknown[] = [];

		// arr = utils.enqueue(arr, '111', size);
		// logger.info(`arr: ${JSON.stringify(arr)}`);

		// arr = utils.enqueue(arr, '222', size);
		// logger.info(`arr: ${JSON.stringify(arr)}`);

		// arr = utils.enqueue(arr, '333', size);
		// logger.info(`arr: ${JSON.stringify(arr)}`);

		// arr = utils.enqueue(arr, '444', size);
		// logger.info(`arr: ${JSON.stringify(arr)}`);

		// arr = utils.enqueue(arr, '555', size);
		// logger.info(`arr: ${JSON.stringify(arr)}`);


	})();


	(async () => {

		// /*

		// Connect:

		// import puppeteerExtra from 'puppeteer-extra';
		// const puppeteer = puppeteerExtra.default;


		// */

		// /*
		// // const __filename = url.fileURLToPath(import.meta.url);
		// // const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
		// */

		// utils.debugLogger('puppeteer: start');

		// /*
		// // const executablePath = join(__dirname, '..', '.cache', 'puppeteer');
		// // utils.debugLogger(`executablePath=${executablePath}`);
		// */

		// const browser = await puppeteer.launch({
		// 	headless: true,
		// 	// executablePath,
		// 	args: ['--no-sandbox'],
		// });

		// utils.debugLogger('puppeteer.launch');
		// const page = await browser.newPage();
		// utils.debugLogger('browser.newPage');

		// await page.goto('https://developer.chrome.com/');
		// utils.debugLogger('page.goto');

		// // Set screen size
		// await page.setViewport({ width: 1080, height: 1024 });

		// // Type into search box
		// await page.type('.search-box__input', 'automate beyond recorder');

		// // Wait and click on first result
		// const searchResultSelector = '.search-box__link';
		// await page.waitForSelector(searchResultSelector);
		// await page.click(searchResultSelector);

		// // Locate the full title with a unique string
		// const textSelector = await page.waitForSelector(
		// 	'text/Customize and automate'
		// );
		// const fullTitle = await textSelector?.evaluate(el => el.textContent);

		// // Print the full title
		// logger.info(`The title of this blog post is "${fullTitle}"`);

		// await browser.close();

	})();


	// mjService.imgRequest('userGuid', 'test prompt')
	// 	.then(
	// 		async (result) => {
	// 			logger.info(`mjService.imgRequest: resolved`);
	// 		},
	// 		async (error) => {
	// 			logger.error(`mjService.imgRequest: rejected`);
	// 		}
	// 	);


	await app.initBot();
	await app.initApi();

	// const loadingFn = (param: string, url: string) => {
	// 	logger.warn(`Loading [${param}] => ${url}`);
	// }

	// await discordService.start();

	// await discordService.clickServer('MindMate');
	// await discordService.clickChannel('mindmate');

	// await discordService.sendMessage('Hello World!');

	// const infoData = await midjourneyService.info();
	// logger.info(`Midjourney account info:\n${JSON.stringify(infoData)}`);

	// const imgPrompt = 'A cat wearing a top hat and a monocle drinking tea, hyperrealistic --ar 16:9 --q 2 --v 5';

	// const imgObj = await midjourneyService.imagine(imgPrompt, loadingFn.bind(this, 'Some param...'));

	// const variation = VariationType.V4;
	// const imgObj = await midjourneyService.imageVariation('1099032040650846208', variation);

	// const enlarge = EnlargeType.U3;
	// const imgObj = await midjourneyService.imageEnlarge('1099300022916485130', enlarge);

	// logger.info(`Image:\n${JSON.stringify(imgObj)}`);

	// await discordService.shutdown();

};

bootstap();