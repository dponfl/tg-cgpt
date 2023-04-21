import { ElementHandle } from 'puppeteer';

export interface IMessage {
	channelId: string;
	messageId: string;
	messageContent: string | null;
	imageUrl?: string | null;
	lazyImageUrl?: string | null;

	article?: string | null;
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
	shutdown: () => Promise<void>;
	closeAllPopups: () => Promise<void>;
	goToMain: () => Promise<void>;
	gotToChannel: (serverId: string, channelId: string) => Promise<void>;
	goToServer: (serverId: string) => Promise<void>;
	clickChannel: (channel: string) => Promise<void>;
	clickServer: (server: string) => Promise<void>;
	sendMessage: (message: string) => Promise<void>;
	sendCommand: (command: string, args?: string) => Promise<void>;
	// getLastMsgRaw: () => Promise<ElementHandle>;
	getLastMsg: () => Promise<IMessage | undefined>;
	// getMessage: (messageId: string) => Promise<IMessage | undefined>;
	// parseMessage: (li: ElementHandle) => Promise<IMessage>;
	// parseIds: (id: string) => IIds;
	getProperty: (elem: ElementHandle | null, property: string) => Promise<string | null>;
	login: () => Promise<boolean>;
	isLoggedIn: () => Promise<boolean>;
	waitLogin: () => Promise<boolean>;
	waitElement: (requiredEval: string, validate?: (elem: ElementHandle) => Promise<boolean>) => Promise<void>;
}