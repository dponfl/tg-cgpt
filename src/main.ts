import { IAIImg, IAIText } from './ai/ai.interface.js';
import { ChatGPTService } from './ai/cgpt/cgpt.class.js';
import { MjService } from './ai/cgpt/mj.class.js';
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
import { GroupTransactionCurrency, GroupTransactionServiceName, IDatabase, IDbServices } from './storage/mysql.interface.js';
import { createPool } from 'mysql2';
import { UsersStorageService } from './storage/users.class.js';
import { IUtils, Utils } from './utils/utils.class.js';
import { BroadcastService } from './broadcast/bc.service.js';
import { IHttpService } from './http/http.interface.js';
import { HttpService } from './http/http.class.js';
import { exit } from 'process';
import { RobokassaService } from './payments/robokassa.class.js';
import { IGetPaymentLinkParams } from './payments/payments.interface.js';
import { GtStorageService } from './storage/gt.class.js';


const bootstap = async () => {


	const logger: ILogger = new UseLogger();
	const configService: IConfigService = new ConfigService(logger);
	const cgptService: IAIText = new ChatGPTService();
	const mjService: IAIImg = new MjService();
	const mainController: IMainController = new MainController(logger, cgptService, mjService);
	const redisSession: RedisSession = new RedisSession({
		store: {
			host: configService.get('REDIS_HOST'),
			port: configService.get('REDIS_PORT'),
			url: configService.get('REDIS_URL')
		}
	});

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

	const utils: IUtils = new Utils(logger);

	const dbServices: IDbServices = {
		usersDbService: new UsersStorageService(dbConnection, logger, utils),
		gtDbService: new GtStorageService(dbConnection, logger, utils)
	};

	const broadcastService = new BroadcastService(logger, dbServices, utils);

	const scenesGenerator: ISceneGenerator = new ScenesGenerator(
		logger,
		mainController,
		redisSession,
		sessionService,
		utils
	);

	const app = new App(
		logger,
		new BotService(
			logger,
			configService,
			scenesGenerator,
			redisSession,
			dbServices,
			sessionService,
			utils,
			broadcastService
		),
	);

	const httpService: IHttpService = new HttpService(logger, utils);

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

	const robokassaService = new RobokassaService(configService, logger, utils, httpService, dbConnection);

	const paramsRobokassa: IGetPaymentLinkParams = {
		amount: 150,
		currency: GroupTransactionCurrency.RUB,
		description: 'Подписка на GPT сервис (10 запросов)',
		uid: '8f149f57-9f04-4bff-b34a-781dc6439bec',
		serviceName: GroupTransactionServiceName.GPT,
		purchasedQty: '10'
	};
	const result = await robokassaService.getPaymentLink(paramsRobokassa);

	logger.info(`Result: ${JSON.stringify(result, null, 2)}`);

	exit;

	await app.init();

};

bootstap();