import { Telegraf, session } from 'telegraf';
import { Stage } from 'telegraf/scenes';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { ISceneGenerator } from '../scenes/scenes.interface.js';
import { IBotService, IMyContext } from './bot.interface.js';

export class BotService implements IBotService {

	public bot: Telegraf<IMyContext>;

	private scenesList: any[] = [];

	constructor(
		private readonly logger: ILogger,
		configService: IConfigService,
		private readonly scenesGenerator: ISceneGenerator
	) {
		this.bot = new Telegraf<IMyContext>(configService.get('TELEGRAM_TOKEN'));
	}

	public async launch(): Promise<void> {

		this.scenesList = [... await this.scenesGenerator.getBaseScenes()];

		const stage = new Stage(this.scenesList);

		this.bot.use(session());
		this.bot.use(stage.middleware());

		this.bot.start(async (ctx) => {

			// await ctx.reply(`Hello, ${ctx.from.first_name}!!!`);

			ctx.firstname = ctx.from.first_name;

			await ctx.scene.enter('intro');

		});



		this.bot.launch();
	}
}