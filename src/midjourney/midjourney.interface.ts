import { ElementHandle } from 'puppeteer';
import { IMessage } from '../discord/discord.interface.js';

export enum EnlargeType {
	U1 = "U1",
	U2 = "U2",
	U3 = "U3",
	U4 = "U4"
}

export enum VariationType {
	V1 = "V1",
	V2 = "V2",
	V3 = "V3",
	V4 = "V4"
}

export interface IMidjourneyService {
	info: () => Promise<IMessage | undefined>;
	imagine: (prompt: string, loading?: (str: string) => void) => Promise<IMessage | undefined>;
	executeImageAction: (action: ElementHandle) => Promise<IMessage | undefined>;
	imageEnlarge: (messageId: string, option: EnlargeType) => Promise<IMessage | undefined>;
	imageVariation: (messageId: string, option: VariationType) => Promise<IMessage | undefined>;
}