import { IMessage } from '../discord/discord.interface.js';

export interface IMidjourneyService {
	info: () => Promise<IMessage | undefined>;
	imagine: (prompt: string, loading?: (str: string) => void) => Promise<IMessage | undefined>;
}