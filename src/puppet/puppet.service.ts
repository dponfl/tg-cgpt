import { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
// import UserDir from 'puppeteer-extra-plugin-user-data-dir';
import { IOptions, IPuppetService } from './puppet.interface.js';

const puppeteer = puppeteerExtra.default;

export class PuppetService implements IPuppetService {

	// tslint:disable-next-line: no-any
	protected browser: Browser | any;
	// tslint:disable-next-line: no-any
	protected page: Page | any;
	protected options: IOptions;

	private readonly discordAppUrl: string = 'https://discord.com/app';
	private readonly discordChannelsUrl: string = 'https://discord.com/channels';

	private readonly username: string;
	private readonly password: string;
	private readonly args: string[] = ['--no-sandbox'];
	private readonly userDataDir: string;
	private readonly logs: boolean = true;
	private readonly headless: boolean = true;
	private readonly waitLoginVal: number;
	private readonly waitElement: number;


	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		private readonly utils: IUtils,
	) {

		puppeteer.use(StealthPlugin());
		// puppeteer.use(require('puppeteer-extra-plugin-user-data-dir')());

		this.username = this.configService.get('DISCORD_USERNAME');
		this.password = this.configService.get('DISCORD_PASSWORD');
		this.userDataDir = this.configService.get('DISCORD_USER_DATA_DIR');
		this.waitLoginVal = Number(this.configService.get('DISCORD_NUM_LOGINS'));
		this.waitElement = Number(this.configService.get('DISCORD_WAIT_TIMEOUT'));


		this.options = {
			logs: this.logs,
			headless: this.headless,
			username: this.username,
			password: this.password,
			userDataDir: this.userDataDir,
			waitElement: this.waitElement,
			waitLogin: this.waitLoginVal,
			args: this.args,
		};
	}

	public async start(serverId?: string): Promise<void> {

		this.browser = await puppeteer.launch({
			headless: this.options.headless,
			userDataDir: this.options.userDataDir,
			args: this.options.args
		});

		this.page = await this.browser.newPage();

		if (serverId) {
			await this.goToServer(serverId);
		} else {
			await this.goToMain();
		}

		await this.login();

		await this.utils.sleep(1000);
	}

	public async shutdown() {
		await this.browser.close();
	}

	public async goToMain() {

		this.logger.info(`[Main]: go`);

		await this.page.goto(this.discordAppUrl, { waitUntil: 'load' });

		await this.utils.sleep(1000);

		this.logger.info(`[Main]: done`);
	}

	public async gotToChannel(serverId: string, channelId: string) {

		this.logger.info(`channel[${serverId}, ${channelId}]: go`);

		await this.page.goto(`${this.discordChannelsUrl}/${serverId}/${channelId}`, { waitUntil: 'load' });

		this.logger.info(`channel[${serverId}, ${channelId}]: navigate`);

		await this.page.waitForSelector(`ol[data-list-id="chat-messages"]`, { visible: true });

		await this.utils.sleep(1000);

		this.logger.info(`channel[${serverId}, ${channelId}]: done`);
	}

	public async goToServer(serverId: string) {

		this.logger.info(`server[${serverId}]: go`);

		await this.page.goto(`${this.discordChannelsUrl}/${serverId}`, { waitUntil: 'load' });

		this.logger.info(`server[${serverId}]: navigate`);

		await this.page.waitForSelector(`div[aria-label="Servers"]`, { visible: true });

		await this.utils.sleep(1000);

		this.logger.info(`server[${serverId}]: done`);
	}

	public async isLoggedIn(): Promise<boolean> {

		const selector = await this.page.waitForSelector('div[class*="sidebar"]', {
			visible: true,
			timeout: 60000,
		});

		this.utils.debugLogger(`Selector (str): ${selector}`);
		this.utils.debugLogger(`Selector: ${JSON.stringify(selector)}`);

		const sidebar = await this.page.$('div[class*="sidebar"]');

		this.utils.debugLogger(`page.$('div[class*="sidebar"]')=${sidebar}`);

		this.logger.info(`[login]: is in? ${sidebar !== null ? 'yes' : 'no'}`);

		return sidebar !== null;
	}

	public async waitLogin(): Promise<boolean> {

		this.logger.info(`[login]: wait`);

		let tryCount = 0;

		let isLoggedIn = await this.isLoggedIn();

		while (!isLoggedIn && tryCount < this.options.waitLogin) {

			isLoggedIn = await this.isLoggedIn();

			tryCount++;

			if (isLoggedIn || tryCount >= this.options.waitLogin) {
				break;
			}

			await this.utils.sleep(1000);
		}

		return isLoggedIn;
	}

	public async login(): Promise<boolean> {

		const methodName = 'login';

		if (await this.isLoggedIn()) {
			this.logger.info(`[login]: already logged in`);
			return true;
		}

		try {

			this.logger.info(`[login]: typing...`);

			await this.page.type('input[name="email"]', this.options.username);

			await this.page.type('input[name="password"]', this.options.password);

			await this.page.click('button[type="submit"]');

			this.logger.info(`[login]: submited`);

			await this.page.waitForNavigation({ waitUntil: 'load' });

			//await (new Promise(r => setTimeout(r, 1000)))

		} catch (e) {
			this.utils.errorLog(this, e, methodName, '[login]: failed');
		}

		const isLoggedIn = await this.waitLogin();

		if (isLoggedIn) {
			this.logger.info(`[login] successful!`);
		} else {
			this.logger.error(`[login] failed!`);
		}

		return isLoggedIn;
	}
}