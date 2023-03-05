import { Context, Markup } from 'telegraf';
import { BaseScene } from 'telegraf/scenes';
import { ISceneGenerator } from './scenes.interface.js';

export class ScenesGenerator implements ISceneGenerator {

	public async getBaseScenes(): Promise<unknown[]> {

		return Promise.all([
			this.startIntro(),
			this.startNext(),
			this.menu()
		]);
	}

	public async getWizardScenes(): Promise<unknown[]> {
		return Promise.all([]);
	}

	/**
	 * Base scenes
	 */

	private async startIntro(): Promise<unknown> {
		const startIntro = new BaseScene('startIntro');

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
			await ctx.scene.enter('introTwo');

		});

		return startIntro;
	}

	private async startNext(): Promise<unknown> {
		const startNext = new BaseScene('startNext');

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
			await ctx.scene.leave();

		});

		return startNext;
	}

	private async menu(): Promise<unknown> {
		const menuScene = new BaseScene('menuScene');

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
					Markup.button.callback('Назад 🔙', 'back')
				],
			]));

		});

		menuScene.action('make_payment', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Оплатить запросы..."');
			await ctx.scene.enter('paymentScene');
		});

		return menuScene;
	}

	private async paymentScene(): Promise<unknown> {
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

		paymentScene.action('menu', async (ctx: any) => {
			await ctx.answerCbQuery('Переход в "Меню"...');
			await ctx.scene.enter('menuScene');
		});

		return paymentScene;
	}

	/**
	 * Wizard scenes
	 */

}