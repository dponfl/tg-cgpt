import { ElementHandle } from 'puppeteer';
import { IConfigService } from '../config/config.interface.js';
import { IDiscordService, IMessage } from '../discord/discord.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { IMidjourneyService } from './midjourney.interface.js';

export class MidjourneyService implements IMidjourneyService {

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		private readonly utils: IUtils,
		private readonly discordService: IDiscordService
	) { }

	/**
	 * Get the info of your current Midjourney subscription
	*/

	public async info(): Promise<IMessage | undefined> {

		await this.discordService.sendCommand("info");

		await this.discordService.waitElement('div[id*="message-accessories"] > article');

		return this.discordService.getLastMsg();
	}

	/**
	 * Request the generation of an image on Midjourney using your prompt
	 * @param prompt a list of words or the description of the image you want
	 * @param loading you will be notified each time the image loading reach a new step
	 */

	private loading(url: string): void {
		this.logger.warn(`[imagine]: Loading => ${url}`);
	}

	private async validateImagine(elem: ElementHandle): Promise<boolean> {

		const it = await this.discordService.getProperty(elem, 'href');

		if (it) {
			this.loading(it);
		}

		return it != null && it.endsWith(".png");
	}

	public async imagine(prompt: string): Promise<IMessage | undefined> {

		this.logger.info(`[imagine]: started`);

		await this.discordService.sendCommand("imagine", `${prompt}`);

		await this.discordService.waitElement('a[data-role="img"]', this.validateImagine.bind(this));

		await this.utils.sleep(1000);

		this.logger.info(`[imagine]: done`);

		return this.discordService.getLastMsg();
	}

}