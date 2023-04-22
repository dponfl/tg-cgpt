import { Browser, Page, ElementHandle } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { IConfigService } from '../config/config.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
// import UserDir from 'puppeteer-extra-plugin-user-data-dir';
import { IOptions, IDiscordService, IIds, IMessage } from './discord.interface.js';

import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';

import formData from 'form-data';
import Mailgun from 'mailgun.js';

const puppeteer = puppeteerExtra.default;

export class DiscordService implements IDiscordService {

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
	private readonly waitElementAttempts: number;
	private readonly mailgunDomain: string;
	private readonly mailgunApiKey: string;
	private readonly twoCaptchaApiKey: string;
	private readonly mg: any;
	private readonly fixie_ip: string;
	private readonly fixie_port: string;
	private readonly fixie_user: string;
	private readonly fixies_pw: string;



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
		this.waitElementAttempts = Number(this.configService.get('DISCORD_WAIT_ELEMENT_ATTEMPTS'));
		this.mailgunApiKey = this.configService.get('MAILGUN_API_KEY');
		this.mailgunDomain = this.configService.get('MAILGUN_DOMAIN');
		this.fixie_ip = this.configService.get('FIXIE_IP');
		this.fixie_port = this.configService.get('FIXIE_PORT');
		this.fixie_user = this.configService.get('FIXIE_USER');
		this.fixies_pw = this.configService.get('FIXIE_PW');

		if (process.env.NODE_ENV === 'production') {
			this.headless = true;
			this.args.push(`--proxy-server=http://${this.fixie_ip}:${this.fixie_port}`);
		}

		this.options = {
			logs: this.logs,
			headless: this.headless,
			username: this.username,
			password: this.password,
			userDataDir: this.userDataDir,
			waitElement: this.waitElementAttempts,
			waitLogin: this.waitLoginVal,
			args: this.args,
		};

		const mailgun = new (Mailgun as any)(formData);

		this.mg = mailgun.client({ username: 'api', key: this.mailgunApiKey });


	}

	private async fixCaptcha(): Promise<void> {

		const captchaIframe = await this.page.$('iframe[src*="hcaptcha.com/"]');

		if (captchaIframe) {
			this.logger.info(`hCaptcha detected...`);

			await this.getScreenshot('Captcha detected');

			let { captchas, filtered, error: errFindCaptcha } = await this.page.findRecaptchas();

			this.logger.warn(`captchas:\n${JSON.stringify(captchas)}`);
			this.logger.warn(`filtered:\n${JSON.stringify(filtered)}`);
			this.logger.warn(`errFindCaptcha:\n${JSON.stringify(errFindCaptcha)}`);

			let { solutions, error: errGetCaptcha } = await this.page.getRecaptchaSolutions(captchas);

			this.logger.warn(`solutions:\n${JSON.stringify(solutions)}`);
			this.logger.warn(`errGetCaptcha:\n${JSON.stringify(errGetCaptcha)}`);

			let { solved, error: errEnterCaptcha } = await this.page.enterRecaptchaSolutions(solutions);

			this.logger.warn(`solved:\n${JSON.stringify(solved)}`);
			this.logger.warn(`errEnterCaptcha:\n${JSON.stringify(errEnterCaptcha)}`);

			await this.getScreenshot('Captcha fixed');

		}

	}

	private async getScreenshot(subject: string | null = null): Promise<void> {

		await this.page.setViewport({ width: 1080, height: 1024 });

		const buffer = await this.page.screenshot({
			fullPage: true,
			fromSurface: false,
			type: 'png'
		});

		const file = {
			filename: 'screenshot.png',
			data: buffer
		};

		const date = new Date();

		const messageParams = {
			from: `TG-ChatGPT <me@${this.mailgunDomain}>`,
			to: ['dmsch.bsn@gmail.com'],
			subject: subject ? subject : `Screenshot img`,
			text: `Pls find screenshot attached at ${date}`,
			attachment: file
		};

		const res = await this.mg.messages.create(this.mailgunDomain, messageParams);

		// this.utils.debugLogger(`MailGun send result:\n${JSON.stringify(res)}`);

	}

	private async getPageContent(subject: string | null = null): Promise<void> {

		await this.page.setViewport({ width: 1080, height: 1024 });

		const content = await this.page.content();

		const file = {
			filename: 'page.html',
			data: content
		};

		const date = new Date();

		const messageParams = {
			from: `TG-ChatGPT <me@${this.mailgunDomain}>`,
			to: ['dmsch.bsn@gmail.com'],
			subject: subject ? subject : `Page content`,
			text: `Pls find page content attached at ${date}`,
			attachment: file
		};

		const res = await this.mg.messages.create(this.mailgunDomain, messageParams);

		this.utils.debugLogger(`MailGun send page content result:\n${JSON.stringify(res)}`);

	}

	private async checkIp(): Promise<void> {

		this.logger.info(`Checking IP...`);

		const pageUrl = 'https://whatismyipaddress.com/';

		await this.page.goto(pageUrl, { waitUntil: 'load' });

		await this.getScreenshot('Checking IP: started');

		await this.utils.sleep(3000);

		// this.logger.info(`[checkIp]: waitForSelector('#qc-cmp2-ui')`);
		// await this.page.waitForSelector('#qc-cmp2-ui');

		const popup = await this.page.$('#qc-cmp2-ui');

		if (popup) {
			this.logger.info('[chckIp]: press "DISAGREE" button & waiting for ip list');
			await Promise.all([
				this.page.waitForSelector('div.ip-address-list'),
				this.page.click('div.qc-cmp2-summary-buttons > button:nth-child(2)'),
			]);
		}


		// //*[@id="qc-cmp2-ui"]/div[2]/div/button[2]
		// document.querySelector("#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button:nth-child(2)")

		await this.getScreenshot('Checking IP: done');

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

	public async start(serverId?: string): Promise<void> {

		this.browser = await puppeteer.launch({
			headless: this.options.headless,
			userDataDir: this.options.userDataDir,
			args: this.options.args
		});

		this.page = await this.browser.newPage();

		// this.page.setDefaultNavigationTimeout(60000);

		/**
		 * authenticate in proxy using basic browser auth
		 */

		if (process.env.NODE_ENV === 'production') {
			await this.page.authenticate({ username: this.fixie_user, password: this.fixies_pw });
		}

		if (serverId) {
			await this.goToServer(serverId);
		} else {
			await this.goToMain();
		}

		await this.login();

		await this.utils.sleep(1000);
	}

	public async shutdown(): Promise<void> {
		this.logger.info(`Shutdown browser`);
		await this.browser.close();
	}

	public async closeAllPopups(): Promise<void> {
		const btns = await this.page.$$('button[aria-label="Close"]')
		for (const btn of btns) {
			await btn.click()
			await this.utils.sleep(1000);
		}
	}

	public async goToMain(): Promise<void> {

		await this.checkIp();

		this.logger.info(`[Main]: go`);

		await this.page.goto(this.discordAppUrl, { waitUntil: 'load' });

		await this.utils.sleep(1000);

		this.logger.info(`[Main]: done`);

		await this.getScreenshot('goToMain');
	}

	public async gotToChannel(serverId: string, channelId: string): Promise<void> {

		this.logger.info(`channel[${serverId}, ${channelId}]: go`);

		await this.page.goto(`${this.discordChannelsUrl}/${serverId}/${channelId}`, { waitUntil: 'load' });

		this.logger.info(`channel[${serverId}, ${channelId}]: navigate`);

		await this.page.waitForSelector(`ol[data-list-id="chat-messages"]`, { visible: true });

		await this.utils.sleep(1000);

		this.logger.info(`channel[${serverId}, ${channelId}]: done`);
	}

	public async goToServer(serverId: string): Promise<void> {

		this.logger.info(`server[${serverId}]: go`);

		await this.page.goto(`${this.discordChannelsUrl}/${serverId}`, { waitUntil: 'load' });

		this.logger.info(`server[${serverId}]: navigate`);

		await this.page.waitForSelector(`div[aria-label="Servers"]`, { visible: true });

		await this.utils.sleep(1000);

		this.logger.info(`server[${serverId}]: done`);
	}

	public async clickChannel(channel: string): Promise<void> {

		this.logger.info(`channel[${channel}]: click`);

		await this.page.waitForSelector(`a[aria-label*="${channel}"]`, { visible: true });

		await this.page.click(`a[aria-label*="${channel}"]`);

		this.logger.info(`channel[${channel}]: navigation`);

		await this.page.waitForSelector(`ol[data-list-id="chat-messages"]`, { visible: true });

		this.logger.info(`channel[${channel}]: done`);

		await this.getScreenshot('clickChannel');
	}

	public async clickServer(server: string): Promise<void> {

		this.logger.info(`server[${server}]: click`);

		await this.utils.sleep(3000);

		await this.closeAllPopups();

		await this.page.waitForSelector(`div[aria-label="Servers"]`, { visible: true });

		// await this.getScreenshot('div[aria-label="Servers"]');

		await this.page.waitForSelector(`div[data-dnd-name="${server}"]`, { visible: true });

		await this.page.click(`div[data-dnd-name="${server}"]`);

		// await this.getScreenshot(`click on div[aria-label="${server}"]`);

		this.logger.info(`server[${server}]: navigation`);

		await this.page.waitForSelector(`ul[aria-label="Channels"]`, { visible: true });

		this.logger.info(`server[${server}]: done`);

		await this.getScreenshot('clickServer');
	}

	public async sendMessage(message: string): Promise<void> {

		this.logger.info(`send message{${message}}`);

		await this.page.click('[data-slate-editor="true"]');

		await this.page.type('[data-slate-editor="true"]', message);

		await this.page.keyboard.press('Enter');

		await this.getScreenshot('sendMessage');
	}

	public async sendCommand(command: string, args?: string): Promise<void> {

		this.logger.info(`send command[${command}: ${args ? args : '[No args]'}]`);

		await this.page.click('[data-slate-editor="true"]');

		await this.page.keyboard.press('/');

		await this.utils.sleep(1000);

		await this.page.type('[data-slate-editor="true"]', `${command}`);

		await this.utils.sleep(2000);

		await this.page.keyboard.press('Enter');

		await this.utils.sleep(1000);

		if (args != null) {
			await this.page.type('[data-slate-editor="true"]', `${args}`);
		}

		await this.page.keyboard.press('Enter');

		await this.utils.sleep(1000);

		await this.getScreenshot('sendCommand');
	}

	private async getLastMsgRaw(): Promise<ElementHandle> {

		await this.page.waitForSelector('ol[data-list-id="chat-messages"] > li:last-of-type');

		return await this.page.$('ol[data-list-id="chat-messages"] > li:last-of-type');
	}

	public async getLastMsg(): Promise<IMessage | undefined> {

		await this.page.waitForSelector('ol[data-list-id="chat-messages"] > li:last-of-type');

		const li = await this.page.$('ol[data-list-id="chat-messages"] > li:last-of-type');

		return this.parseMessage(li);
	}

	public async getMessage(messageId: string): Promise<IMessage | undefined> {
		const methodName = 'getMessage';
		try {
			const li = await this.page.$(`li[id="${messageId}"]`);

			if (li == null) {
				throw new Error(`Message ${messageId} not found`);
			}
			return await this.parseMessage(li);
		} catch (error) {
			this.utils.errorLog(this, error, methodName);
		}
	}

	private parseIds(id: string): IIds {

		const ids = id.split("-");

		return {
			channelId: ids[2],
			messageId: ids[3]
		}
	}

	public async getProperty(elem: ElementHandle | null, property: string): Promise<string | null> {

		const jsProperty = await elem?.getProperty(property);

		const value = await jsProperty?.jsonValue();

		if (typeof value === 'string') {
			return value;
		} else {
			return null;
		}
	}

	private async parseMessage(li: ElementHandle): Promise<IMessage | undefined> {
		const methodName = 'parseMessage';
		try {

			const liId = await this.getProperty(li, 'id');

			if (!liId) {
				throw new Error('liId is null');
			}

			const { channelId, messageId } = this.parseIds(liId);

			await this.page.waitForSelector(`li[id="${liId}"] div[id="message-content-${messageId}"]`);

			const content = await li.$eval(`div[id="message-content-${messageId}"]`, it => it.textContent);

			const aTag = await li.$('a[data-role="img"]');

			const imgTag = await li.$('img[alt="Image"]');

			const imageUrl = await this.getProperty(aTag, 'href');

			const lazyImageUrl = await this.getProperty(imgTag, 'src');

			const article = await li.$('div[class*="embedDescription"]');

			let articleContent = null;

			if (article != null) {
				articleContent = await li.$eval('div[class*="embedDescription"]', it => it.textContent);
			}

			const accessories = await li.$('div[id*="message-accessories"]');

			if (!accessories) {
				throw new Error('accessories is null');
			}

			const divs = await accessories.$$('button');

			const actions = Object();

			for (const div of divs) {
				const textContent = await div.evaluate(el => el.textContent);

				if (textContent
					&& (textContent.startsWith('U') || textContent.startsWith('V'))
				) {
					actions[textContent] = div
				}
			}

			return {
				channelId: channelId,
				messageId: messageId,
				messageContent: content,
				imageUrl: imageUrl,
				lazyImageUrl: lazyImageUrl,
				article: articleContent,
				actions: actions
			}

		} catch (error) {
			this.utils.errorLog(this, error, methodName);
		}
	}

	public async isLoggedIn(): Promise<boolean> {

		// await this.getScreenshot();

		const sidebar = await this.page.$('div[class*="sidebar"]');

		// this.utils.debugLogger(`page.$('div[class*="sidebar"]')=${sidebar}`);

		this.logger.info(`[login]: is in? ${sidebar !== null ? 'yes' : 'no'}`);

		return sidebar !== null;
	}

	public async waitLogin(): Promise<boolean> {

		await this.getScreenshot('waitLogin started');

		this.logger.info(`[login]: wait`);

		let tryCount = 0;

		let isLoggedIn = await this.isLoggedIn();

		if (!isLoggedIn) {
			await this.fixCaptcha();
		}

		while (!isLoggedIn && tryCount < this.options.waitLogin) {

			isLoggedIn = await this.isLoggedIn();

			tryCount++;

			if (isLoggedIn || tryCount >= this.options.waitLogin) {
				break;
			}

			await this.utils.sleep(1000);
		}

		await this.getScreenshot('waitLogin finished');

		return isLoggedIn;
	}

	public async waitElement(requiredEval: string, validate?: (elem: ElementHandle) => Promise<boolean>): Promise<void> {

		const methodName = 'waitElement';

		try {

			let tryCount = 0;

			while (tryCount < this.options.waitElement) {

				const last: ElementHandle = await this.getLastMsgRaw();

				const found = await last.$(requiredEval);

				let isValid = found != null;

				if (
					isValid
					&& validate != null
					&& found
				) {
					isValid = await validate(found);
				}

				this.logger.info(`[waitElement]: found[${found !== null ? "yes" : "no"}] valid[${isValid ? "yes" : "no"}]`);

				this.getScreenshot('waitElement');

				tryCount++;

				if (isValid || tryCount >= this.options.waitElement) {
					break;
				};

				await this.utils.sleep(7000);
			}
		} catch (error) {
			this.utils.errorLog(this, error, methodName);
		}
	}

	public async login(): Promise<boolean> {

		const methodName = 'login';

		if (await this.isLoggedIn()) {
			this.logger.info(`[login]: already logged in`);
			return true;
		}

		try {

			await this.getScreenshot('login: start');

			this.logger.info(`[login]: typing...`);

			await this.page.type('input[name="email"]', this.options.username);

			await this.page.type('input[name="password"]', this.options.password);

			await this.getScreenshot('login: input done');

			await this.page.click('button[type="submit"]');

			this.logger.info(`[login]: submited`);

			await this.utils.sleep(3000);

			this.logger.info(`[login]: checking for captcha: started...`);

			await this.fixCaptcha();

			this.logger.info(`[login]: checking for captcha: done...`);

			await this.utils.sleep(3000);

			// await this.page.waitForNavigation({ waitUntil: 'load' });

			//await (new Promise(r => setTimeout(r, 1000)))

		} catch (e) {

			await this.getScreenshot('login: on error catch');

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