import { ElementHandle } from 'puppeteer';
import { IConfigService } from '../config/config.interface.js';
import { IDiscordService, IMessage } from '../discord/discord.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { EnlargeType, IMidjourneyService, VariationType } from './midjourney.interface.js';

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

	private loading(url: string): void {
		this.logger.warn(`Loading => ${url}`);
	}

	private async validateImg(elem: ElementHandle): Promise<boolean> {

		const it = await this.discordService.getProperty(elem, 'href');

		if (it) {
			this.loading(it);
		}

		return it != null && it.endsWith(".png");
	}

	/**
	 * Request the generation of an image on Midjourney using your prompt
	 * @param prompt a list of words or the description of the image you want
	 * @param loading you will be notified each time the image loading reach a new step
	 */

	public async imagine(prompt: string): Promise<IMessage | undefined> {

		this.logger.info(`[imagine]: started`);

		await this.discordService.sendCommand("imagine", `${prompt}`);

		await this.discordService.waitElement('a[data-role="img"]', this.validateImg.bind(this));

		await this.utils.sleep(1000);

		this.logger.info(`[imagine]: done`);

		return this.discordService.getLastMsg();
	}


	/**
	 * Execute a given Image action (U1<>U4, V1<>V4) and wait for the image to be loaded
	 * @param action Based on the resp.actions[] from imagine()
	 * @param loading you will be notified each time the image loading reach a new step
	 */

	public async executeImageAction(action: ElementHandle): Promise<IMessage | undefined> {

		this.logger.info(`[executeImageAction]: started`);

		await action.click();

		await this.utils.sleep(3000);

		await this.discordService.waitElement('a[data-role="img"]', this.validateImg.bind(this));

		this.logger.info(`[executeImageAction]: done`);

		return this.discordService.getLastMsg();
	}

	/**
	 * Request an enlarge of the given image ID
	 * @param messageId from imagine() response
	 * @param option midjourney will create 4 images, you can enlarge any of those
	 * @param loading you will be notified each time the image loading reach a new step
	 */

	public async imageEnlarge(messageId: string, option: EnlargeType): Promise<IMessage | undefined> {

		const methodName = 'imageEnlarge';

		try {

			this.logger.info(`[imageEnlarge]: started`);

			const message = await this.discordService.getMessage(messageId);

			if (message && message.actions[option] == null) {
				throw new Error(`Option ${option} not found`)
			}

			if (message) {
				return this.executeImageAction(message.actions[option]);
			}

		} catch (error) {
			this.utils.errorLog(this, error, methodName);
		}
	}

	/**
	 * Request a variation on the given image ID
	 * @param messageId from imagine() response
	 * @param option midjourney will create 4 images, you can get a variation any of those
	 * @param loading you will be notified each time the image loading reach a new step
	 */

	public async imageVariation(messageId: string, option: VariationType): Promise<IMessage | undefined> {

		const methodName = 'imageVariation';

		try {

			this.logger.info(`[imageVariation]: started`);

			const message = await this.discordService.getMessage(messageId);
			;
			if (message && message.actions[option] == null) {
				throw new Error(`Option ${option} not found`)
			}

			if (message) {
				return this.executeImageAction(message.actions[option]);
			}

		} catch (error) {
			this.utils.errorLog(this, error, methodName);
		}
	}

}