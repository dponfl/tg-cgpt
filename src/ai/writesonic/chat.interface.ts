import { AiTextResponse } from '../../controller/controller.interface.js';

export enum WriteSonicEngine {
	PREMIUM = 'premium',
	GOOD = 'good',
	AVERAGE = 'average',
	ECONOMY = 'economy'
}

export enum WriteSonicLang {
	RU = 'ru',
	EN = 'en',
	FR = 'fr',
	DE = 'de'
}

export interface IWriteSonicHistoryData {
	is_sent: boolean;
	message: string;
}

export interface IWriteSonicChatBodyParams {
	enable_google_results: boolean;
	enable_memory: boolean;
	input_text: string;
	history_data?: IWriteSonicHistoryData[];
}

export interface IWriteSonicChatMetadataParams {
	engine: WriteSonicEngine;
	language: WriteSonicLang;
}

export interface IWriteSonicChatService {
	textRequest: (user: string, prompt: string, historyData: IWriteSonicHistoryData[]) => Promise<AiTextResponse>;
}