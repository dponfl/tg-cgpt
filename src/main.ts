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
import { IDatabase, IDbServices } from './storage/mysql.interface.js';
import { createPool } from 'mysql2';
import { UsersSrorageService } from './storage/users.class.js';
import { IUtils, Utils } from './utils/utils.class.js';
import { BroadcastService } from './broadcast/bc.service.js';


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
		usersDbService: new UsersSrorageService(dbConnection, logger, utils)
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

	await app.init();

};

bootstap();