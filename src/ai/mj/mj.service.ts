import { IConfigService } from '../../config/config.interface.js';
import { AiImgResponse } from '../../controller/controller.interface.js';
import { ILogger } from '../../logger/logger.interface.js';
import { IDbServices } from '../../storage/mysql.interface.js';
import { IUtils } from '../../utils/utils.class.js';
import { IMjService } from './mj.interface.js';
import { Puppet, options, MidjourneyPuppet, Option } from '@d-lab/discord-puppet';

export class MjService implements IMjService {

	private readonly puppet: Puppet;

	private readonly options: Option;
	private readonly username: string;
	private readonly password: string;
	private readonly args: string[] = [];
	private readonly userDataDir: string;
	private readonly logs: boolean = true;
	private readonly headless: boolean = true;
	private readonly waitLogin: number = 10;
	private readonly waitElement: number = 1000;

	private readonly discordServerName: string;
	private readonly discordChannelName: string;

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		public readonly dbServices: IDbServices,
		private readonly utils: IUtils
	) {

		this.discordServerName = this.configService.get('DISCORD_SERVER');
		this.discordChannelName = this.configService.get('DISCORD_CHANNEL');

		this.username = this.configService.get('DISCORD_USERNAME');
		this.password = this.configService.get('DISCORD_PASSWORD');
		this.userDataDir = this.configService.get('DISCORD_USER_DATA_DIR');

		this.options = options(
			this.username,
			this.password,
			this.args,
			this.userDataDir,
			this.logs,
			this.headless,
			this.waitLogin,
			this.waitElement
		);

		this.puppet = new Puppet(this.options);
	}

	// tslint:disable-next-line: promise-function-async
	public imgRequest(userGuid: string, prompt: string): Promise<AiImgResponse> {
		return new Promise(async (resolve, reject) => {

			await this.puppet.start();
			await this.puppet.clickServer(this.discordServerName);
			await this.puppet.clickChannel(this.discordChannelName);
			await this.puppet.sendMessage('Hello World!!!');

		});
	}

}