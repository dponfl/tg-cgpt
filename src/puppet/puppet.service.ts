import { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
// import UserDir from 'puppeteer-extra-plugin-user-data-dir';
import { IOptions, IPuppetService } from './puppet.interface.js';

import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';

import { cwd } from 'node:process';
import path from 'path';
import fs from 'fs';

import formData from 'form-data';
import Mailgun from 'mailgun.js';

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
	private readonly args: string[] = [
		'--no-sandbox',
		'--disable-setuid-sandbox',
		'--disable-dev-shm-usage',
		'--single-process'
	];
	private readonly userDataDir: string;
	private readonly logs: boolean = true;
	private readonly headless: boolean = true;
	private readonly waitLoginVal: number;
	private readonly waitElement: number;
	private readonly mailgunDomain: string;
	private readonly mailgunApiKey: string;
	private readonly twoCaptchaApiKey: string;


	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		private readonly utils: IUtils,
	) {

		this.twoCaptchaApiKey = this.configService.get('2CAPTCHA_API_KEY');

		puppeteer.use(StealthPlugin());
		// puppeteer.use(require('puppeteer-extra-plugin-user-data-dir')());

		puppeteer.use(
			(RecaptchaPlugin as any)({
				provider: {
					id: '2captcha',
					token: this.twoCaptchaApiKey
				}
			})
		);

		this.username = this.configService.get('DISCORD_USERNAME');
		this.password = this.configService.get('DISCORD_PASSWORD');
		this.userDataDir = this.configService.get('DISCORD_USER_DATA_DIR');
		this.waitLoginVal = Number(this.configService.get('DISCORD_NUM_LOGINS'));
		this.waitElement = Number(this.configService.get('DISCORD_WAIT_TIMEOUT'));
		this.mailgunApiKey = this.configService.get('MAILGUN_API_KEY');
		this.mailgunDomain = this.configService.get('MAILGUN_DOMAIN');


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

	private async getScreenshot(tag: string = ''): Promise<void> {

		await this.page.setViewport({ width: 1080, height: 1024 });

		const buffer = await this.page.screenshot({
			fullPage: true,
			type: 'png'
		});

		const mailgun = new (Mailgun as any)(formData);

		const mg = mailgun.client({ username: 'api', key: this.mailgunApiKey });

		const file = {
			filename: 'screenshot.png',
			data: buffer
		};

		const messageParams = {
			from: `User <me@${this.mailgunDomain}>`,
			to: ['dmsch.bsn@gmail.com'],
			subject: `Screenshot img ${tag}`,
			text: "Pls find screenshot attached",
			attachment: file
		};

		const res = await mg.messages.create(this.mailgunDomain, messageParams);

		this.utils.debugLogger(`MailGun send result:\n${JSON.stringify(res)}`);

	}

	public async startTest(serverId?: string): Promise<void> {

		this.browser = await puppeteer.launch({
			headless: this.options.headless,
			userDataDir: this.options.userDataDir,
			args: this.options.args
		});

		this.page = await this.browser.newPage();

		await this.page.goto('https://developer.chrome.com/');

		await this.getScreenshot();

		await this.page.type('.search-box__input', 'automate beyond recorder');

		const searchResultSelector = '.search-box__link';
		await this.page.waitForSelector(searchResultSelector);
		await this.page.click(searchResultSelector);

		// Locate the full title with a unique string
		const textSelector = await this.page.waitForSelector(
			'text/Customize and automate'
		);
		const fullTitle = await textSelector?.evaluate((el: any) => el.textContent);

		// Print the full title
		this.logger.info(`The title of this blog post is "${fullTitle}"`);

		await this.browser.close();

	}


	public async shutdown() {
		this.logger.info(`Shutdown browser`);
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

		// await this.getScreenshot();

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

			await this.getScreenshot(`-${tryCount}`);

			await this.page.solveRecaptchas();

			await this.getScreenshot(`-${tryCount}`);

			await this.page.waitForNavigation();

			await this.getScreenshot(`-${tryCount}`);

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