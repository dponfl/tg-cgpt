import { ElementHandle } from 'puppeteer';

export interface IMessage {
	channelId: string;
	messageId: string;
	messageContent: string;
	imageUrl?: string;
	lazyImageUrl?: string;

	article?: string;
	actions: { [key: string]: ElementHandle };
}

export interface IIds {
	channelId: string;
	messageId: string;
}

export interface IOptions {
	logs: boolean;
	headless: boolean;
	username: string;
	password: string;
	userDataDir?: string;
	waitElement: number;
	waitLogin: number;
	args: string[];
}

export interface IDiscordService {
	start: (serverId?: string) => Promise<void>;
	startTest: (serverId?: string) => Promise<void>;
	shutdown: () => unknown;
	goToMain: () => unknown;
	gotToChannel: (serverId: string, channelId: string) => unknown;
	goToServer: (serverId: string) => unknown;
	clickChannel?: (channel: string) => unknown;
	clickServer?: (server: string) => unknown;
	sendMessage?: (message: string) => unknown;
	sendCommand?: (command: string, args?: string) => unknown;
	getLastMsgRaw?: () => unknown;
	getLastMsg?: () => unknown;
	parseMessage?: (li: ElementHandle) => unknown;
	parseIds?: (id: string) => IIds;
	getProperty?: (elem: ElementHandle | null, property: string) => Promise<string | null>;
	login: () => Promise<boolean>;
	isLoggedIn: () => Promise<boolean>;
	waitLogin: () => Promise<boolean>;
}