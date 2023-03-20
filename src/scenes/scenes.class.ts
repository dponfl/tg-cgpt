import { Kysely } from 'kysely';
import { Context, Markup } from 'telegraf';
import { BaseScene } from 'telegraf/scenes';
import { IBotContext } from '../bot/bot.interface.js';
import { MySceneCommand } from '../commands/base_scenes/command.class.js';
import { GptCommand } from '../commands/base_scenes/gpt.command.js';
import { HelpCommand } from '../commands/base_scenes/help.command.js';
import { MenuCommand } from '../commands/base_scenes/menu.command.js';
import { MjCommand } from '../commands/base_scenes/mj.command.js';
import { PaymentCommand } from '../commands/base_scenes/payment.command.js';
import { StartCommand } from '../commands/base_scenes/start.command.js';
import { InfoCommand } from '../commands/base_scenes/info.command.js';
import { IConfigService } from '../config/config.interface.js';
import { AiTextResponsePayload, ControllerStatus, IMainController, OpenAiChatFinishReason, RequestCategory } from '../controller/controller.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IGetPaymentLinkParams, IGetPaymentLinkResponse, IPaymentService } from '../payments/payments.interface.js';
import { GroupTransactionCurrency, GroupTransactionServiceName, IDatabase } from '../storage/mysql.interface.js';
import { ISessionService } from '../storage/session.interface.js';
import { ChatSceneNames } from '../types.js';
import { IUtils } from '../utils/utils.class.js';
import { ISceneGenerator } from './scenes.interface.js';
import { Update } from 'telegraf/types';
import { ConfigService } from '../config/config.service.js';

export class ScenesGenerator implements ISceneGenerator {

	private commands: MySceneCommand[] = [];
	private readonly textOnMessage =
		`
Работаю над вашим вопросом ⏳

`;

	private readonly secondRequestText =
		`
<b>В данный момент я обрабатываю ваш предыдущий запрос</b> 🔄

После моего ответа, вы сможете задать следующий вопрос 👌🏼

`;

	private readonly pushToPayText =
		`
К <i>сожалению текущий лимит запросов подошёл к концу</i>, <b>чтобы продолжить коммуникацию со мной — выберите один из пакетов по кнопке ниже</b> 👇
`;

	private readonly errorResponseText =
		`
К сожалению что-то пошло не так 😔

Пожалуйста, повторите ваш вопрос 🙏🏾

`;

	constructor(
		private readonly logger: ILogger,
		private readonly configService: IConfigService,
		private readonly mainController: IMainController,
		private readonly sessionService: ISessionService,
		private readonly utils: IUtils,
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly robokassaService: IPaymentService
	) { }

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
			this.afterPaymentGptScene(),
			this.mainMJScene(),
			this.afterPaymentMJScene(),
			this.menuScene(),
			this.paymentScene(),
			this.pushToPaymentScene(),
			this.infoScene(),
			this.helpScene()
		]);
	}

	public async getWizardScenes(): Promise<unknown[]> {
		return Promise.all([]);
	}

	private async activateCommands(scene: BaseScene): Promise<void> {

		/**
		 * Init scene commands
		 */

		this.commands = [
			new StartCommand(scene, this.logger, this.utils),
			new MenuCommand(scene, this.logger),
			new PaymentCommand(scene, this.logger),
			new GptCommand(scene, this.logger),
			new MjCommand(scene, this.logger),
			new InfoCommand(scene, this.logger),
			new HelpCommand(scene, this.logger),
		];

		for (const command of this.commands) {
			await command.handle();
		}

	}

	private async moveToRespectiveChat(ctx: IBotContext): Promise<void> {

		switch (ctx.session.botUserSession.chatName) {
			case ChatSceneNames.mainGptScene:
			case ChatSceneNames.afterPaymentGptScene:
				await ctx.scene.enter(ChatSceneNames.afterPaymentGptScene);
				break;

			case ChatSceneNames.mainMJScene:
			case ChatSceneNames.afterPaymentMJScene:
				await ctx.scene.enter(ChatSceneNames.afterPaymentMJScene);
				break;

			default:
				this.logger.error(`Unknown scene at ctx.session.botUserSession.chatName=${ctx.session.botUserSession.chatName}`);
				await ctx.scene.enter(ChatSceneNames.afterPaymentGptScene);
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

		// tslint:disable-next-line: no-any
		mainGptScene.enter(async (ctx: any) => {
			const { message_id: messageId } = await ctx.replyWithHTML(textMain);

			ctx.session.botUserSession.pinnedMessage = messageId;
			ctx.session.botUserSession.chatName = ChatSceneNames.mainGptScene;
			this.sessionService.updateSession(ctx);

			await ctx.pinChatMessage(messageId);
		});

		// tslint:disable-next-line: no-any
		mainGptScene.on('message', async (ctx: any) => {
			await this.gptOnMessage(ctx, mainGptScene);
		});

		// tslint:disable-next-line: no-any
		mainGptScene.action('stream_request', async (ctx: any) => {
			await this.gptActionStreamRequest(ctx, mainGptScene);
		});

		// tslint:disable-next-line: no-any
		mainGptScene.action('pay_package', async (ctx: any) => {

			await ctx.answerCbQuery();
			await ctx.replyWithHTML(`✅ Вы выбрали: <b><i>Оплатить запросы ✅</i></b>`);
			await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

			await ctx.scene.enter('pushToPaymentScene');

		});

		// tslint:disable-next-line: no-any
		mainGptScene.leave(async (ctx: any) => {
			if (ctx.session.botUserSession.pinnedMessage > 0) {
				try {
					await ctx.unpinChatMessage(ctx.session.botUserSession.pinnedMessage);
				} catch (err) {
					this.logger.error(`Error: Cannot perform unpinChatMessage: ${err}`);
				}
			}
		});

		// this.mainGptSceneProp = mainGptScene;

		return mainGptScene;
	}

	private async afterPaymentGptScene(): Promise<BaseScene> {

		const afterPaymentGptScene = new BaseScene('afterPaymentGptScene');

		await this.activateCommands(afterPaymentGptScene);

		// tslint:disable-next-line: no-any
		afterPaymentGptScene.enter(async (ctx: any) => {

			ctx.session.botUserSession.chatName = ChatSceneNames.afterPaymentGptScene;
			this.sessionService.updateSession(ctx);

		});

		// tslint:disable-next-line: no-any
		afterPaymentGptScene.on('message', async (ctx: any) => {
			await this.gptOnMessage(ctx, afterPaymentGptScene);
		});

		// tslint:disable-next-line: no-any
		afterPaymentGptScene.action('stream_request', async (ctx: any) => {
			await this.gptActionStreamRequest(ctx, afterPaymentGptScene);
		});

		// tslint:disable-next-line: no-any
		afterPaymentGptScene.action('pay_package', async (ctx: any) => {

			await ctx.answerCbQuery();
			await ctx.replyWithHTML(`✅ Вы выбрали: <b><i>Оплатить запросы ✅</i></b>`);
			await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

			await ctx.scene.enter('pushToPaymentScene');

		});


		// tslint:disable-next-line: no-any
		afterPaymentGptScene.leave(async (ctx: any) => {
		});

		return afterPaymentGptScene;
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

		// tslint:disable-next-line: no-any
		mainMJScene.enter(async (ctx: any) => {
			const { message_id: messageId } = await ctx.replyWithHTML(textMain);

			ctx.session.botUserSession.pinnedMessage = messageId;
			ctx.session.botUserSession.chatName = ChatSceneNames.mainMJScene;

			this.sessionService.updateSession(ctx);

			await ctx.pinChatMessage(messageId);
		});


		// tslint:disable-next-line: no-any
		mainMJScene.on('message', async (ctx: any) => {

			if (ctx.session.botUserSession.pendingMjRequest) {

				// tslint:disable-next-line: no-shadowed-variable
				const { message_id } = await ctx.replyWithHTML(this.secondRequestText);
				setTimeout(() => {
					ctx.deleteMessage(message_id);
				}, 5000);

			} else {

				const { message_id } = await ctx.replyWithHTML(this.textOnMessage);

				const text = ctx.message.text;

				ctx.session.botUserSession.pendingMjRequest = true;

				this.sessionService.updateSession(ctx);

				// tslint:disable-next-line: max-line-length
				const userGuid = ctx.session.botUserSession.userGuid ? ctx.session.botUserSession.userGuid : this.utils.getChatIdStr(ctx);

				this.mainController.imgRequest(userGuid, text)
					.then(
						async (result) => {
							ctx.session.botUserSession.pendingMjRequest = false;
							this.sessionService.updateSession(ctx);
							const resText = result?.join('\n\n');
							await ctx.deleteMessage(message_id);
							await ctx.replyWithHTML(resText,
								{ reply_to_message_id: ctx.update.message.message_id });
						},
						async (error) => {

							this.logger.error(`Error response from mjImgRequest: ${error}`);

							ctx.session.botUserSession.pendingMjRequest = false;

							this.sessionService.updateSession(ctx);

							await ctx.deleteMessage(message_id);
							await ctx.replyWithHTML(this.errorResponseText,
								{ reply_to_message_id: ctx.update.message.message_id });
						}
					);

			}
		});

		// tslint:disable-next-line: no-any
		mainMJScene.leave(async (ctx: any) => {
			if (ctx.session.botUserSession.pinnedMessage > 0) {
				try {
					await ctx.unpinChatMessage(ctx.session.botUserSession.pinnedMessage);
				} catch (err) {
					this.logger.error(`Error: Cannot perform unpinChatMessage: ${err}`);
				}
			}
		});

		// this.mainMJSceneProp = mainMJScene;

		return mainMJScene;
	}

	private async afterPaymentMJScene(): Promise<BaseScene> {

		const afterPaymentMJScene = new BaseScene('afterPaymentMJScene');

		await this.activateCommands(afterPaymentMJScene);

		// tslint:disable-next-line: no-any
		afterPaymentMJScene.enter(async (ctx: any) => {

			ctx.session.botUserSession.chatName = ChatSceneNames.mainMJScene;

			this.sessionService.updateSession(ctx);
		});


		// tslint:disable-next-line: no-any
		afterPaymentMJScene.on('message', async (ctx: any) => {

			if (ctx.session.botUserSession.pendingMjRequest) {

				// tslint:disable-next-line: no-shadowed-variable
				const { message_id } = await ctx.replyWithHTML(this.secondRequestText);
				setTimeout(() => {
					ctx.deleteMessage(message_id);
				}, 5000);

			} else {

				const { message_id } = await ctx.replyWithHTML(this.textOnMessage);

				const text = ctx.message.text;

				ctx.session.botUserSession.pendingMjRequest = true;

				this.sessionService.updateSession(ctx);

				// tslint:disable-next-line: max-line-length
				const userGuid = ctx.session.botUserSession.userGuid ? ctx.session.botUserSession.userGuid : this.utils.getChatIdStr(ctx);

				this.mainController.imgRequest(userGuid, text)
					.then(
						async (result) => {
							ctx.session.botUserSession.pendingMjRequest = false;
							this.sessionService.updateSession(ctx);
							const resText = result?.join('\n\n');
							await ctx.deleteMessage(message_id);
							await ctx.replyWithHTML(resText,
								{ reply_to_message_id: ctx.update.message.message_id });
						},
						async (error) => {

							this.logger.error(`Error response from mjImgRequest: ${error}`);

							ctx.session.botUserSession.pendingMjRequest = false;

							this.sessionService.updateSession(ctx);

							await ctx.deleteMessage(message_id);
							await ctx.replyWithHTML(this.errorResponseText,
								{ reply_to_message_id: ctx.update.message.message_id });
						}
					);

			}
		});

		// tslint:disable-next-line: no-any
		afterPaymentMJScene.leave(async (ctx: any) => {
		});

		return afterPaymentMJScene;
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
		menuScene.action('make_payment', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Оплатить запросы"');
			await ctx.deleteMessage();
			await ctx.scene.enter('paymentScene');
		});

		// tslint:disable-next-line: no-any
		menuScene.action('info', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Статистику"');
			await ctx.deleteMessage();
			await ctx.scene.enter('infoScene');
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

		// tslint:disable-next-line: no-any
		paymentScene.enter(async (ctx: any) => {

			const gptPrice = this.configService.get('PACKAGE_GPT_PRICE');
			const gptQty = this.configService.get('PACKAGE_GPT_QTY');
			const gptService = this.configService.get('PACKAGE_GPT_SERVICE');

			const mjPrice = this.configService.get('PACKAGE_MJ_PRICE');
			const mjQty = this.configService.get('PACKAGE_MJ_QTY');
			const mjService = this.configService.get('PACKAGE_MJ_SERVICE');

			const gpt_mjPrice = this.configService.get('PACKAGE_GPT_MJ_PRICE');
			const gpt_mj_gptQty = this.configService.get('PACKAGE_GPT_MJ_GPT_QTY');
			const gpt_mj_mjQty = this.configService.get('PACKAGE_GPT_MJ_MJ_QTY');
			const gpt_mj_mjService = this.configService.get('PACKAGE_GPT_MJ_SERVICE');

			const text =
				`
	Для того, чтобы пользоваться всем функционалом необходимо оплатить запросы 👇 
	
	1) ${gptQty} запросов <b>для искусственного интеллекта (GPT)</b> — ${gptPrice}₽
	
	2) ${mjQty} запросов для <b>Midjourney</b> — ${mjPrice}₽
	
	3) ${gpt_mj_gptQty} запросов для <b>искусственного интеллекта (GPT)</b> + ${gpt_mj_mjQty} запросов для <b>Midjourney</b> — ${gpt_mjPrice}₽
	`;

			/**
			 * Build payment links
			 */

			/**
			 * Check if the user have unused payment links
			 */

			if (!ctx.session.botUserSession.userGuid) {
				this.logger.error(`ERROR: No botUserSession.userGuid: ${JSON.stringify(ctx.session.botUserSession)}, will try to restore data.`);

				/**
				 * Получаем запись пользователя и обновляем данные
				 */

				const { fromId, chatId } = this.utils.getChatIdObj(ctx);

				if (!fromId || !chatId) {
					throw new Error(`ERROR: missing fromId or chatId: fromId=${fromId}, chatId=${chatId}`);
				}

				const userRecRaw = await this.dbConnection
					.selectFrom('users')
					.select('guid')
					.where('fromId', '=', fromId)
					.where('chatId', '=', chatId)
					.execute();

				if (!userRecRaw) {
					throw new Error(`ERROR: No user rec for fromId=${fromId} and chatId=${chatId}`);
				}

				const { guid } = userRecRaw[0];

				ctx.session.botUserSession.userGuid = guid;

				this.sessionService.updateSession(ctx);

			}

			const gptParamsRobokassa: IGetPaymentLinkParams = {
				amount: Number(gptPrice),
				currency: GroupTransactionCurrency.RUB,
				description: `Подписка на GPT сервис (${gptQty} запросов)`,
				uid: ctx.session.botUserSession.userGuid,
				serviceName: GroupTransactionServiceName.GPT,
				purchasedQty: gptService,
			};

			const mjParamsRobokassa: IGetPaymentLinkParams = {
				amount: Number(mjPrice),
				currency: GroupTransactionCurrency.RUB,
				description: `Подписка на Midjourney сервис (${mjQty} запросов)`,
				uid: ctx.session.botUserSession.userGuid,
				serviceName: GroupTransactionServiceName.MJ,
				purchasedQty: mjService,
			};

			const gptAndMjParamsRobokassa: IGetPaymentLinkParams = {
				amount: Number(gpt_mjPrice),
				currency: GroupTransactionCurrency.RUB,
				description: `Подписка на GPT сервис (${gpt_mj_gptQty} запросов) и Midjourney сервис (${gpt_mj_mjQty} запросов)`,
				uid: ctx.session.botUserSession.userGuid,
				serviceName: GroupTransactionServiceName.GPT_MJ,
				purchasedQty: gpt_mj_mjService,
			};

			const { url: gptUrl } = await this.robokassaService.getPaymentLink(gptParamsRobokassa) as IGetPaymentLinkResponse;

			const { url: mjUrl } = await this.robokassaService.getPaymentLink(mjParamsRobokassa) as IGetPaymentLinkResponse;

			// tslint:disable-next-line: max-line-length
			const { url: gptAndMjUrl } = await this.robokassaService.getPaymentLink(gptAndMjParamsRobokassa) as IGetPaymentLinkResponse;

			const { message_id: messageId } = await ctx.replyWithHTML(text, Markup.inlineKeyboard([
				[
					Markup.button.url(`1) 🤖 Gpt ${gptPrice}₽`, gptUrl)
				],
				[
					Markup.button.url(`2) 🎑 Midjourney ${mjPrice}₽`, mjUrl)
				],
				[
					Markup.button.url(`3) 🔝 GPT + Midjourney ${gpt_mjPrice}₽`, gptAndMjUrl)
				],
			]));

			if (messageId) {
				ctx.session.botUserSession.paymentMessageId = messageId;
				this.sessionService.updateSession(ctx);
			}

			await this.moveToRespectiveChat(ctx);
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

			// tslint:disable-next-line: no-shadowed-variable
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

	private async infoScene(): Promise<BaseScene> {

		const infoScene = new BaseScene('infoScene');

		await this.activateCommands(infoScene);

		// tslint:disable-next-line: no-any
		infoScene.enter(async (ctx: any) => {

			if (!ctx.session.botUserSession.userGuid) {
				throw new Error(`No ctx.session.botUserSession.userGuid`);
			}

			const serviceUsageData = await this.utils.getServiceUsageInfo(ctx.session.botUserSession.userGuid);

			if (!serviceUsageData) {
				throw new Error(`Could not get service usage data`);
			}
			const {
				gptPurchased,
				gptLeft,
				mjPurchased,
				mjLeft,
				gptFreeReceived,
				gptFreeLeft,
				mjFreeReceived,
				mjFreeLeft,
			} = serviceUsageData;

			const text =
				`
<i>Бесплатных запросов <b>Gpt</b> (доступно):</i> <b>${gptFreeLeft}</b> из <b>${gptFreeReceived}</b>

<i>Бесплатных запросов <b>Midjourney</b> (доступно):</i> <b>${mjFreeLeft}</b> из <b>${mjFreeReceived}</b>

———————————————

<i>Платных</i> <b>запросов Gpt</b> (доступно): <b>${gptLeft}</b> из <b>${gptPurchased}</b>

<i>Платных</i> <b>запросов Midjourney</b> (доступно): <b>${mjLeft}</b> из <b>${mjPurchased}</b>
	
	`;

			await ctx.replyWithHTML(text, Markup.inlineKeyboard([
				[
					Markup.button.callback('Вернуться в меню  🔙', 'menu')
				]
			]));
		});

		// tslint:disable-next-line: no-any
		infoScene.action('menu', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Меню"');
			await ctx.deleteMessage();
			await ctx.scene.enter('menuScene');
		});

		infoScene.on('message', async (ctx) => {

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


		return infoScene;
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

	// tslint:disable-next-line: no-any
	private async gptOnMessage(ctx: any, scene: BaseScene<Context<Update>>) {

		if (ctx.session.botUserSession.pendingChatGptRequest) {

			// tslint:disable-next-line: no-shadowed-variable
			const { message_id } = await ctx.replyWithHTML(this.secondRequestText);
			setTimeout(() => {
				ctx.deleteMessage(message_id);
			}, 5000);

		} else {

			const { message_id } = await ctx.replyWithHTML(this.textOnMessage);

			const text = ctx.message.text;

			this.setTextSessionData(ctx, ctx.message.text, ctx.message.message_id);

			const { userGuid, chatId } = await this.getUserData(ctx);

			this.mainController.orchestrator<AiTextResponsePayload[]>(userGuid, chatId, text, RequestCategory.chatText)
				.then(
					async (result) => {

						let msgText = '';

						await ctx.deleteMessage(message_id);

						if (!Array.isArray(result.payload)) {
							throw new Error(`result.payload should be array, result:\n${JSON.stringify(result)}`);
						}

						switch (result.status) {
							case ControllerStatus.SUCCESS:

								let i = 1;

								for (const elem of result.payload as AiTextResponsePayload[]) {

									msgText = result.payload.length > 1
										? `<b>Ответ ${i} 👇</b>\n\n${elem.payload}`
										: elem.payload;
									i++;

									switch (elem.finishReason) {
										case OpenAiChatFinishReason.stop:
										case OpenAiChatFinishReason.content_filter:
										case OpenAiChatFinishReason.null:
											await ctx.replyWithHTML(msgText,
												{ reply_to_message_id: ctx.update.message.message_id });

											this.clearTextSessionData(ctx);

											break;

										case OpenAiChatFinishReason.length:
											await ctx.replyWithHTML(msgText,
												{
													reply_to_message_id: ctx.update.message.message_id,
													...Markup.inlineKeyboard([
														[
															Markup.button.callback('Продолжай 📝', 'stream_request')
														]
													])
												}
											);
											break;

										default:
											this.logger.error(`Unknown finishReason: ${elem.finishReason}`);
											await ctx.replyWithHTML(msgText,
												{ reply_to_message_id: ctx.update.message.message_id });

											this.clearTextSessionData(ctx);
									}
								}

								break;

							case ControllerStatus.ACTION_PAYMENT:

								await ctx.replyWithHTML(this.pushToPayText,
									Markup.inlineKeyboard([
										[
											Markup.button.callback('Оплатить запросы ✅', 'pay_package')
										]
									])
								);

								this.clearTextSessionData(ctx);

								break;

							case ControllerStatus.ERROR:
								this.logger.error(`Error respose from MainController.orchestrator:\n${JSON.stringify(result)}`);

								await ctx.deleteMessage(message_id);

								await this.sendErrorMsgOnTextResponse(ctx);

								break;

							default:

								this.logger.error(`UserGuid=${userGuid}, Unknown result.status, result:\n${JSON.stringify(result)}`);

								this.clearTextSessionData(ctx);
						}
					},
					async (error) => {

						this.logger.error(`UserGuid: ${userGuid}, Error response from mainController.orchestrator: ${error}`);

						await ctx.deleteMessage(message_id);

						if (!ctx.session.botUserSession.textRequestMessageId) {
							this.logger.error(`UserGuid: ${ctx.session.botUserSession.userGuid}, Missing ctx.session.botUserSession.textRequestMessageId`);
							await ctx.replyWithHTML(this.errorResponseText);
						} else {
							await ctx.replyWithHTML(this.errorResponseText,
								{ reply_to_message_id: ctx.session.botUserSession.textRequestMessageId });
						}

						this.clearTextSessionData(ctx);

					}
				);

		}
	}

	// tslint:disable-next-line: no-any
	private async gptActionStreamRequest(ctx: any, scene: BaseScene<Context<Update>>): Promise<void> {

		await ctx.answerCbQuery('Продолжаю работать над вашим запросом...');

		await ctx.replyWithHTML(`✅ Вы выбрали: <b><i>Продолжай 📝</i></b>`);
		await ctx.editMessageReplyMarkup({ inline_keyboard: [] });


		if (ctx.session.botUserSession.pendingChatGptRequest) {

			// tslint:disable-next-line: no-shadowed-variable
			const { message_id } = await ctx.replyWithHTML(this.secondRequestText);
			setTimeout(() => {
				ctx.deleteMessage(message_id);
			}, 5000);

		} else {

			const { message_id } = await ctx.replyWithHTML(this.textOnMessage);

			if (!ctx.session.botUserSession.textRequest) {
				throw new Error(`Missing ctx.session.botUserSession.textRequest`);
			}

			const text = ctx.session.botUserSession.textRequest;

			ctx.session.botUserSession.pendingChatGptRequest = true;

			this.sessionService.updateSession(ctx);

			const { userGuid, chatId } = await this.getUserData(ctx);

			this.mainController.orchestrator<AiTextResponsePayload>(userGuid, chatId, text, RequestCategory.chatTextStream)
				.then(
					async (result) => {

						this.clearTextSessionData(ctx);

						let msgText = '';

						await ctx.deleteMessage(message_id);

						msgText = result.payload.payload;

						if (!ctx.session.botUserSession.textRequestMessageId) {
							this.logger.error(`UserGuid: ${ctx.session.botUserSession.userGuid}, Missing ctx.session.botUserSession.textRequestMessageId`);
							await ctx.replyWithHTML(msgText);
						} else {
							await ctx.replyWithHTML(msgText, { reply_to_message_id: ctx.session.botUserSession.textRequestMessageId });
						}

					},
					async (error) => {

						this.logger.error(`UserGuid: ${userGuid}, Error response from mainController.orchestrator: ${error}`);

						await ctx.deleteMessage(message_id);

						if (!ctx.session.botUserSession.textRequestMessageId) {
							this.logger.error(`UserGuid: ${ctx.session.botUserSession.userGuid}, Missing ctx.session.botUserSession.textRequestMessageId`);
							await ctx.replyWithHTML(this.errorResponseText);
						} else {
							await ctx.replyWithHTML(this.errorResponseText,
								{ reply_to_message_id: ctx.session.botUserSession.textRequestMessageId });
						}

						this.clearTextSessionData(ctx);
					}
				);
		}
	}

	private async sendErrorMsgOnTextResponse(ctx: IBotContext): Promise<void> {
		if (!ctx.session.botUserSession.textRequestMessageId) {
			this.logger.error(`UserGuid: ${ctx.session.botUserSession.userGuid}, Missing ctx.session.botUserSession.textRequestMessageId:
			\n${JSON.stringify(ctx.session.botUserSession)}`);
			await ctx.replyWithHTML(this.errorResponseText);
		} else {
			await ctx.replyWithHTML(this.errorResponseText,
				{ reply_to_message_id: ctx.session.botUserSession.textRequestMessageId });
		}

		this.clearTextSessionData(ctx);

	}

	private setTextSessionData(ctx: IBotContext, text: string, messageId: number): void {
		ctx.session.botUserSession.pendingChatGptRequest = true;
		ctx.session.botUserSession.textRequest = text;
		ctx.session.botUserSession.textRequestMessageId = messageId;
		this.sessionService.updateSession(ctx);
	}

	private clearTextSessionData(ctx: IBotContext): void {
		ctx.session.botUserSession.pendingChatGptRequest = false;
		ctx.session.botUserSession.textRequest = '';
		ctx.session.botUserSession.textRequestMessageId = 0;
		this.sessionService.updateSession(ctx);
	}

	private async getUserGuid(ctx: IBotContext): Promise<string | null> {
		if (ctx.session.botUserSession.userGuid) {

			return ctx.session.botUserSession.userGuid;
		} else {

			const { fromId, chatId } = this.utils.getChatIdObj(ctx);

			if (!fromId || !chatId) {
				this.logger.error(`Could not get fromId/chatId from ctx`);
				return null;
			}

			const userRecRaw = await this.dbConnection
				.selectFrom('users')
				.selectAll()
				.where('fromId', '=', fromId)
				.where('chatId', '=', chatId)
				.execute();

			if (
				!userRecRaw
				|| !Array.isArray(userRecRaw)
				|| userRecRaw.length !== 1
			) {
				this.logger.error(`Wrong response from DB on user with chatId=${chatId} and fromId=${fromId}, result:\n${JSON.stringify(userRecRaw)}`);
				return null;
			}

			return userRecRaw[0].guid;
		}


	}

	private async getUserData(ctx: IBotContext): Promise<{ userGuid: string, chatId: number, fromId: number }> {
		// tslint:disable-next-line: max-line-length
		const userGuid = await this.getUserGuid(ctx);

		const { chatId, fromId } = this.utils.getChatIdObj(ctx);

		if (!userGuid) {
			throw new Error(`Could not get userGuid for user with chatId=${chatId} and fromId=${fromId}`);
		}

		if (!chatId) {
			throw new Error(`Could not get chatId for userGuid=${userGuid}`);
		}

		if (!fromId) {
			throw new Error(`Could not get fromId for userGuid=${userGuid}`);
		}

		return {
			userGuid,
			chatId,
			fromId
		};
	}

	/**
	 * Wizard scenes
	 */

}