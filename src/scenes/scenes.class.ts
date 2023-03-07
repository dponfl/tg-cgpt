import { Markup } from 'telegraf';
import { BaseScene } from 'telegraf/scenes';
import { BotCommand } from 'typegram';
import { ChatGPTService } from '../ai/cgpt/cgpt.class.js';
import { MjService } from '../ai/cgpt/mj.class.js';
import { IBotContext } from '../bot/bot.interface.js';
import { MySceneCommand } from '../commands/base_scenes/command.class.js';
import { GptCommand } from '../commands/base_scenes/gpt.command.js';
import { HelpCommand } from '../commands/base_scenes/help.command.js';
import { MenuCommand } from '../commands/base_scenes/menu.command.js';
import { MjCommand } from '../commands/base_scenes/mj.command.js';
import { PaymentCommand } from '../commands/base_scenes/payment.command.js';
import { StatsCommand } from '../commands/base_scenes/stats.command.js';
import { ILogger } from '../logger/logger.interface.js';
import createSession from '../middleware/user_session.js';
import { ISceneGenerator } from './scenes.interface.js';

export class ScenesGenerator implements ISceneGenerator {

	// private menuSceneProp: BaseScene = Object(BaseScene);
	// private mainGptSceneProp: BaseScene = Object(BaseScene);
	// private mainMJSceneProp: BaseScene = Object(BaseScene);
	// private pushToPaymentSceneProp: BaseScene = Object(BaseScene);
	// private statsSceneProp: BaseScene = Object(BaseScene);

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
			this.paymentScene(),
			this.pushToPaymentScene(),
			this.statsScene(),
			this.helpScene()
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
			new PaymentCommand(scene),
			new GptCommand(scene),
			new MjCommand(scene),
			new StatsCommand(scene),
			new HelpCommand(scene),
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

			setTimeout(async () => {
				await ctx.scene.enter('startNext');
			}, 5000);

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
			setTimeout(async () => {
				await ctx.scene.enter('mainGptScene');
			}, 3000);

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

		const textOnMessage =
			`
Работаю над вашим вопросом ⏳

`;

		// 		const textOnMessage01 =
		// 			`
		// Работаю над вашим вопросом 🔄
		// `;

		// 		const textOnMessage02 =
		// 			`
		// Работаю над вашим вопросом 🔃
		// `;

		mainGptScene.enter(async (ctx: any) => {
			const { message_id: messageId } = await ctx.replyWithHTML(textMain);

			ctx.session.botUserSession.pinnedMessage = messageId;

			await ctx.pinChatMessage(messageId, { disable_notification: true });
		});


		// tslint:disable-next-line: no-any
		mainGptScene.on('message', async (ctx: any) => {

			if (ctx.session.botUserSession.pendingChatGptRequest) {

				const secondRequestText =
					`
<b>В данный момент я обрабатываю ваш предыдущий запрос</b> 🔄

После моего ответа, вы сможете задать следующий вопрос 👌🏼

`;

				// tslint:disable-next-line: no-shadowed-variable
				const { message_id } = await ctx.replyWithHTML(secondRequestText);
				setTimeout(() => {
					ctx.deleteMessage(message_id);
				}, 5000);

			} else {

				const { message_id } = await ctx.replyWithHTML(textOnMessage);

				/**
				 * The below approach can hit Telegram limit for sending messages
				 */
				// const { message_id } = await ctx.replyWithHTML(textOnMessage01);

				// const opt = Object(message_id);

				// const int01 = setInterval(async () => {
				// 	await ctx.telegram.editMessageText(ctx.chat.id, message_id, undefined, textOnMessage02);
				// 	setTimeout(async () => {
				// 		await ctx.telegram.editMessageText(ctx.chat.id, message_id, undefined, textOnMessage01);
				// 	}, 500);
				// }, 1000);

				// setTimeout(async () => {
				// 	clearInterval(int01);
				// 	await ctx.deleteMessage(message_id);
				// 	await ctx.replyWithHTML('This is a reply to your request',
				// 		{ reply_to_message_id: ctx.update.message.message_id });
				// }, 5000);


				/**
				 * To show functionality
				 */

				// setTimeout(async () => {
				// 	await ctx.deleteMessage(message_id);
				// 	await ctx.replyWithHTML('This is a reply to your request',
				// 		{ reply_to_message_id: ctx.update.message.message_id });
				// }, 5000);

				const chatGPTService = new ChatGPTService();

				// This solution block user communication

				// const str = await chatGPTService.textRequest('some text');

				// await ctx.deleteMessage(message_id);
				// await ctx.replyWithHTML(str,
				// 	{ reply_to_message_id: ctx.update.message.message_id });


				const text = ctx.message.text;

				ctx.session.botUserSession.pendingChatGptRequest = true;

				chatGPTService.textRequest(text)
					.then(
						async (result) => {
							ctx.session.botUserSession.pendingChatGptRequest = false;

							await ctx.deleteMessage(message_id);
							await ctx.replyWithHTML(result,
								{ reply_to_message_id: ctx.update.message.message_id });
						},
						async (error) => {

							const errorResponseText =
								`
К сожалению что-то пошло не так 😔

Пожалуйста, повторите ваш вопрос 🙏🏾

`;

							ctx.session.botUserSession.pendingChatGptRequest = false;

							await ctx.deleteMessage(message_id);
							await ctx.replyWithHTML(errorResponseText,
								{ reply_to_message_id: ctx.update.message.message_id });
						}
					);

			}

		});

		mainGptScene.leave(async (ctx: any) => {
			if (ctx.session.botUserSession.pinnedMessage > 0) {
				await ctx.unpinChatMessage(ctx.session.botUserSession.pinnedMessage);
			}
		});

		// this.mainGptSceneProp = mainGptScene;

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

		const textOnMessage =
			`
Работаю над вашим вопросом ⏳

`;

		mainMJScene.enter(async (ctx: any) => {
			const { message_id: messageId } = await ctx.replyWithHTML(textMain);

			ctx.session.botUserSession.pinnedMessage = messageId;

			await ctx.pinChatMessage(messageId, { disable_notification: true });
		});


		mainMJScene.on('message', async (ctx: any) => {

			if (ctx.session.botUserSession.pendingMjRequest) {

				const secondRequestText =
					`
<b>В данный момент я обрабатываю ваш предыдущий запрос</b> 🔄

После моего ответа, вы сможете задать следующий вопрос 👌🏼

`;

				// tslint:disable-next-line: no-shadowed-variable
				const { message_id } = await ctx.replyWithHTML(secondRequestText);
				setTimeout(() => {
					ctx.deleteMessage(message_id);
				}, 5000);

			} else {

				const { message_id } = await ctx.replyWithHTML(textOnMessage);

				const mjService = new MjService();

				const text = ctx.message.text;

				ctx.session.botUserSession.pendingMjRequest = true;

				mjService.textRequest(text)
					.then(
						async (result) => {
							ctx.session.botUserSession.pendingMjRequest = false;

							await ctx.deleteMessage(message_id);
							await ctx.replyWithHTML(result,
								{ reply_to_message_id: ctx.update.message.message_id });
						},
						async (error) => {

							const errorResponseText =
								`
К сожалению что-то пошло не так 😔

Пожалуйста, повторите ваш вопрос 🙏🏾

`;

							ctx.session.botUserSession.pendingMjRequest = false;

							await ctx.deleteMessage(message_id);
							await ctx.replyWithHTML(errorResponseText,
								{ reply_to_message_id: ctx.update.message.message_id });
						}
					);

			}
		});

		mainMJScene.leave(async (ctx: any) => {
			if (ctx.session.botUserSession.pinnedMessage > 0) {
				await ctx.unpinChatMessage(ctx.session.botUserSession.pinnedMessage);
			}
		});

		// this.mainMJSceneProp = mainMJScene;

		return mainMJScene;
	}

	private async menuScene(): Promise<BaseScene> {

		const menuScene = new BaseScene('menuScene');

		await this.activateCommands(menuScene);

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
					Markup.button.callback('Информация ℹ️', 'stats')
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
		menuScene.action('make_payment', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Оплатить запросы"');
			await ctx.deleteMessage();
			await ctx.scene.enter('paymentScene');
		});

		// tslint:disable-next-line: no-any
		menuScene.action('stats', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Статистику"');
			await ctx.deleteMessage();
			await ctx.scene.enter('statsScene');
		});

		// tslint:disable-next-line: no-any
		menuScene.action('help', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Помощь"');
			await ctx.deleteMessage();
			await ctx.scene.enter('helpScene');
		});

		// tslint:disable-next-line: no-any
		menuScene.action('back', async (ctx: any) => {
			await ctx.answerCbQuery('Выход из  "Меню"');
			await ctx.deleteMessage();
			await ctx.scene.enter('mainGptScene');
		});

		menuScene.on('message', async (ctx) => {

			const text =
				`
Для коммуникации со мной, используй кнопки выше 👆🏾 

— Чтобы вернуться в чат GPT, используй команду /gpt

— Чтобы вернуться в Midjourney, используй команду /img

`;

			const { message_id: messageId } = await ctx.replyWithHTML(text);

			// tslint:disable-next-line: no-shadowed-variable
			setTimeout(async () => {
				await ctx.deleteMessage(messageId);
			}, 10000);

		});

		// this.menuSceneProp = menuScene;

		return menuScene;
	}

	private async paymentScene(): Promise<BaseScene> {

		const paymentScene = new BaseScene('paymentScene');

		await this.activateCommands(paymentScene);

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

		paymentScene.on('message', async (ctx) => {

			const text =
				`
Для коммуникации со мной, используй кнопки выше 👆🏾 

— Чтобы вернуться в чат GPT, используй команду /gpt

— Чтобы вернуться в Midjourney, используй команду /img

`;

			const { message_id: messageId } = await ctx.replyWithHTML(text);

			// tslint:disable-next-line: no-shadowed-variable
			setTimeout(async () => {
				await ctx.deleteMessage(messageId);
			}, 10000);

		});


		return paymentScene;
	}

	private async pushToPaymentScene(): Promise<BaseScene> {

		const pushToPaymentScene = new BaseScene('pushToPaymentScene');

		await this.activateCommands(pushToPaymentScene);

		let messageId: number;

		const text =
			`
К <i>сожалению текущий лимит запросов подошёл к концу</i>, <b>чтобы продолжить коммуникацию со мной — выберите один из пакетов по кнопке ниже</b> 👇
`;

		// tslint:disable-next-line: no-any
		pushToPaymentScene.enter(async (ctx: any) => {

			const { message_id } = await ctx.replyWithHTML(text, Markup.inlineKeyboard([
				[
					Markup.button.callback('Оплатить запросы ✅', 'make_payment')
				]
			]));

			messageId = message_id;

		});

		// tslint:disable-next-line: no-any
		pushToPaymentScene.action('make_payment', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Оплатить запросы"');
			await ctx.deleteMessage();
			await ctx.scene.enter('paymentScene');
		});

		// pushToPaymentScene.on('message', async (ctx) => {

		// 	if (messageId) {
		// 		await ctx.deleteMessage(messageId);
		// 	}

		// 	const { message_id } = await ctx.replyWithHTML(text, Markup.inlineKeyboard([
		// 		[
		// 			Markup.button.callback('Оплатить запросы ✅', 'make_payment')
		// 		]
		// 	]));

		// 	messageId = message_id;

		// });

		// this.pushToPaymentSceneProp = pushToPaymentScene;

		pushToPaymentScene.on('message', async (ctx) => {

			const text =
				`
Для коммуникации со мной, используй кнопки выше 👆🏾 

— Чтобы вернуться в чат GPT, используй команду /gpt

— Чтобы вернуться в Midjourney, используй команду /img

`;

			// tslint:disable-next-line: no-shadowed-variable
			const { message_id: messageId } = await ctx.replyWithHTML(text);

			// tslint:disable-next-line: no-shadowed-variable
			setTimeout(async () => {
				await ctx.deleteMessage(messageId);
			}, 10000);

		});

		return pushToPaymentScene;
	}

	private async statsScene(): Promise<BaseScene> {

		const statsScene = new BaseScene('statsScene');

		await this.activateCommands(statsScene);

		statsScene.enter(async (ctx) => {

			const usedFree = Math.floor(Math.random() * 10);
			const usedGpt = Math.floor(Math.random() * 10);
			const usedMJ = Math.floor(Math.random() * 10);

			const text =
				`
<i>Бесплатных запросов:</i> <b>${usedFree}</b> из <b>5</b>

<i>Платных</i> <b>запросов Gpt</b>: <b>${usedGpt}</b> из <b>10</b>

<i>Платных</i> <b>запросов Midjourney</b>: <b>${usedMJ}</b> из <b>10</b>
	
	`;

			await ctx.replyWithHTML(text, Markup.inlineKeyboard([
				[
					Markup.button.callback('Вернуться в меню  🔙', 'menu')
				]
			]));
		});

		// tslint:disable-next-line: no-any
		statsScene.action('menu', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Меню"');
			await ctx.deleteMessage();
			await ctx.scene.enter('menuScene');
		});

		statsScene.on('message', async (ctx) => {

			const text =
				`
Для коммуникации со мной, используй кнопки выше 👆🏾 

— Чтобы вернуться в чат GPT, используй команду /gpt

— Чтобы вернуться в Midjourney, используй команду /img

`;

			// tslint:disable-next-line: no-shadowed-variable
			const { message_id: messageId } = await ctx.replyWithHTML(text);

			// tslint:disable-next-line: no-shadowed-variable
			setTimeout(async () => {
				await ctx.deleteMessage(messageId);
			}, 10000);

		});


		// const statsSceneProp = statsScene;

		return statsScene;
	}

	private async helpScene(): Promise<BaseScene> {

		const helpScene = new BaseScene('helpScene');

		await this.activateCommands(helpScene);


		helpScene.enter(async (ctx) => {

			const text =
				`
<b>Если у вас возникли вопросы</b> <i>или сложности при коммуникации со мной, напишите нам в поддержку</i> @mindmatehelp
`;
			await ctx.replyWithHTML(text, Markup.inlineKeyboard([
				[
					Markup.button.callback('Вернуться в меню  🔙', 'menu')
				]
			]));

		});

		// tslint:disable-next-line: no-any
		helpScene.action('menu', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Меню"');
			await ctx.deleteMessage();
			await ctx.scene.enter('menuScene');
		});

		helpScene.on('message', async (ctx) => {

			const text =
				`
Для коммуникации со мной, используй кнопки выше 👆🏾 

— Чтобы вернуться в чат GPT, используй команду /gpt

— Чтобы вернуться в Midjourney, используй команду /img

`;

			// tslint:disable-next-line: no-shadowed-variable
			const { message_id: messageId } = await ctx.replyWithHTML(text);

			// tslint:disable-next-line: no-shadowed-variable
			setTimeout(async () => {
				await ctx.deleteMessage(messageId);
			}, 10000);

		});


		return helpScene;
	}

	/**
	 * Wizard scenes
	 */

}