import { Markup } from 'telegraf';
import { BaseScene } from 'telegraf/scenes';
import { BotCommand } from 'typegram';
import { MySceneCommand } from '../commands/base_scenes/command.class.js';
import { GptCommand } from '../commands/base_scenes/gpt.command.js';
import { MenuCommand } from '../commands/base_scenes/menu.command.js';
import { MjCommand } from '../commands/base_scenes/mj.command.js';
import { ILogger } from '../logger/logger.interface.js';
import { ISceneGenerator } from './scenes.interface.js';

export class ScenesGenerator implements ISceneGenerator {

	private menuSceneProp: BaseScene = Object(BaseScene);
	private mainGptSceneProp: BaseScene = Object(BaseScene);
	private mainMJSceneProp: BaseScene = Object(BaseScene);

	private commands: MySceneCommand[] = [];

	constructor(private readonly logger: ILogger) { }

	public async getScenes(): Promise<BaseScene[] | unknown[]> {
		const baseScenes = await this.getBaseScenes();
		const wizardScenes = await this.getWizardScenes();

		return [...baseScenes, ...wizardScenes];
	}

	public async getBaseScenes(): Promise<BaseScene[]> {
		return Promise.all([
			this.startIntro(),
			this.startNext(),
			this.mainGptScene(),
			this.mainMJScene(),
			this.menuScene(),
			this.paymentScene()
		]);
	}

	public async getWizardScenes(): Promise<unknown[]> {
		return Promise.all([]);
	}

	/**
	 * list of commands the scene will handle 
	 */

	private readonly sceneCommands: readonly BotCommand[] = [
		{
			command: 'menu',
			description: 'Главное меню',
		},
		{
			command: 'img',
			description: 'Запрос в Midjorney',
		},
		{
			command: 'pay',
			description: 'Оплатить запросы',
		},
		{
			command: 'info',
			description: 'Информация по запросам',
		},
		{
			command: 'help',
			description: 'Помощь',
		},
	];

	private async activateCommands(scene: BaseScene): Promise<void> {

		/**
		 * Init scene commands
		 */

		this.commands = [
			new MenuCommand(scene),
			new GptCommand(scene),
			new MjCommand(scene),
		];

		for (const command of this.commands) {
			await command.handle();
		}

	}


	/**
	 * Base scenes
	 */

	private async startIntro(): Promise<BaseScene> {
		const startIntro = new BaseScene('startIntro');

		// tslint:disable-next-line: no-any
		startIntro.enter(async (ctx: any) => {

			const text =
				`
<b>Привет, я искусственный интеллект и я готов помочь вам практически с любыми вопросами</b>, которые могут возникнуть 🙌🏻

<i>Я буду для вас тем самым Джарвисом из фильма «Железный человек»</i> 🤖

<b>Я основываю свои советы на десятках тысячах изученных мною книг, обладаю высокой скоростью обработки информации</b>, <i>могу анализировать огромные объемы данных за короткий промежуток времени и быстро даю ответы на самые сложные вопросы</i> 🎯

<i>Наглядные примеры моих возможностей:</i>

<b>1.Образование</b>
Эссе
Реферат
Математические задачи 

<b>2.Программирование</b>
Бот для телеграм 
Код на PHP
Код на Python 
Код на Java 

<b>3.Копирайтинг</b>
Рекламный креатив
Продающий пост для телеграм 
Воронка продаж 

<b>4.Midjourney</b>
Мень для ресторана  
Визитка 
Изображение по тз

<i>Этот список не включает и 1% моих возможностей</i>, <b>начните общение со мной и убедитесь в этом сами</b> 😉
`;

			await ctx.replyWithHTML(text);
			await ctx.scene.enter('startNext');

		});

		return startIntro;
	}

	private async startNext(): Promise<BaseScene> {
		const startNext = new BaseScene('startNext');

		// tslint:disable-next-line: no-any
		startNext.enter(async (ctx: any) => {

			const text =
				`
<b>❗️Обязательно изучите это, чтобы общение со мной было для вас удобным и понятным❗️</b>

<b>1️⃣Для того чтобы получать от меня ответы</b> — <i>просто напишите интересующий вопрос в строку с сообщением.</i> Чем корректнее и точнее будет задан вопрос, тем более качественно я смогу на него ответить

<b>Пример:</b> <i>Напиши мне эссе на 200 слов о пользе насекомых, не забудь добавить вступление, а так же сделать вывод</i>

<b>2️⃣Для того чтобы получить изображения от Midjourney</b> напишите в строке для сообщения команду <i>/img</i> и после этого опишите изображение. 

<b>Пример:</b>
<i>/img: мальчик с мячом играет с кошкой, лес, озеро.</i>

3️⃣Для того чтобы вызвать главное меню — <b>введи в строке с сообщением команду</b> <i>/menu</i>
`;

			await ctx.replyWithHTML(text);
			await ctx.scene.enter('mainGptScene');

		});

		return startNext;
	}

	private async mainGptScene(): Promise<BaseScene> {
		const mainGptScene = new BaseScene('mainGptScene');

		await this.activateCommands(mainGptScene);

		const textMain =
			`
<b>Сейчас вы находитесь в Чате Gpt</b> 🤖 

Секреты GPT (гиперссылка)

<i>Все ваши обращения которые вы напишете</i> — <b>будут отправлены мне</b>. 

<i>Чтобы перейти к Midjourney</i> — введите команду /img

`;

		const textOnMessage01 =
			`
Работаю над вашим вопросом 🔄
`;

		const textOnMessage02 =
			`
Работаю над вашим вопросом 🔃
`;

		mainGptScene.enter(async (ctx) => {
			await ctx.replyWithHTML(textMain);
		});


		mainGptScene.on('message', async (ctx) => {

			const { message_id } = await ctx.replyWithHTML(textOnMessage01);

			const opt = Object(message_id);

			const int01 = setInterval(async () => {
				await ctx.editMessageText(textOnMessage02, opt);
				setTimeout(async () => {
					await ctx.editMessageText(textOnMessage01, opt);
				}, 500);
			}, 1000);

			setTimeout(async () => {
				clearInterval(int01);
				await ctx.deleteMessage(message_id);
				await ctx.replyWithHTML('This is a reply to your request',
					{ reply_to_message_id: ctx.update.message.message_id });
			}, 5000);

			// await ctx.replyWithHTML('This is a reply to your request',
			// 	{ reply_to_message_id: ctx.update.message.message_id });
		});

		this.mainGptSceneProp = mainGptScene;

		return mainGptScene;
	}

	private async mainMJScene(): Promise<BaseScene> {
		const mainMJScene = new BaseScene('mainMJScene');

		await this.activateCommands(mainMJScene);

		const textMain =
			`
<b>Сейчас вы находитесь в Midjourney</b> 🏞

Секреты Midjourney (гиперссылка)

<i>Все ваши обращения которые вы напишете</i> — <b>будут отправлены мне</b>. 

<i>Чтобы вернуться к чату GPT</i> — введите команду /gpt

`;

		mainMJScene.enter(async (ctx) => {
			await ctx.replyWithHTML(textMain);
		});


		mainMJScene.on('message', async (ctx) => {
			await ctx.replyWithHTML('This is a reply to your MJ request',
				{ reply_to_message_id: ctx.update.message.message_id });
		});

		this.mainMJSceneProp = mainMJScene;

		return mainMJScene;
	}

	private async menuScene(): Promise<BaseScene> {
		const menuScene = new BaseScene('menuScene');

		// tslint:disable-next-line: no-any
		menuScene.enter(async (ctx: any) => {

			const text =
				`
Добро пожаловать в главное меню, для коммуникации используй кнопки ниже 👇
`;

			await ctx.replyWithHTML(text, Markup.inlineKeyboard([
				[
					Markup.button.callback('Оплатить запросы ✅', 'make_payment')
				],
				[
					Markup.button.callback('Информация ℹ️', 'info')
				],
				[
					Markup.button.callback('Помощь 👨🏻🔧', 'help')
				],
				[
					Markup.button.callback('Назад в GPT 🔙', 'back')
				],
			]));

		});

		// tslint:disable-next-line: no-any
		// tslint:disable-next-line: no-any
		menuScene.action('make_payment', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Оплатить запросы"');
			await ctx.deleteMessage();
			await ctx.scene.enter('paymentScene');
		});

		// tslint:disable-next-line: no-any
		menuScene.action('back', async (ctx: any) => {
			await ctx.answerCbQuery('Выход из  "Меню"');
			await ctx.deleteMessage();
			await ctx.scene.enter('mainGptScene');
		});

		this.menuSceneProp = menuScene;

		return menuScene;
	}

	private async paymentScene(): Promise<BaseScene> {
		const paymentScene = new BaseScene('paymentScene');

		paymentScene.enter(async (ctx) => {

			const text =
				`
	Для того, чтобы пользоваться всем функционалом необходимо оплатить запросы 👇 
	
	1)10 запросов <b>для искусственного интеллекта (GPT)</b> — 150₽
	
	2)10 запросов для <b>Midjourney</b> — 150₽
	
	3)10 запросов для <b>искусственного интеллекта</b> + 10 запросов для <b>Midjourney</b> — 250₽
	`;

			await ctx.replyWithHTML(text, Markup.inlineKeyboard([
				[
					Markup.button.callback('1) 🤖 Gpt 150₽', 'pay_gpt')
				],
				[
					Markup.button.callback('2) 🎑 Midjourney 150₽', 'pay_mj')
				],
				[
					Markup.button.callback('3) 🔝 GPT + Midjourney 250₽', 'pay_gpt_mj')
				],
				[
					Markup.button.callback('Вернуться в меню  🔙', 'menu')
				],
			]));

		});

		// tslint:disable-next-line: no-any
		paymentScene.action('menu', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Меню"');
			await ctx.deleteMessage();
			await ctx.scene.enter('menuScene');
		});

		return paymentScene;
	}

	/**
	 * Wizard scenes
	 */

}