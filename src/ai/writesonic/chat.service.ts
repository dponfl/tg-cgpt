import { AiResponseStatus, AiTextResponse } from '../../controller/controller.interface.js';
// tslint:disable-next-line: max-line-length
import { IWriteSonicChatBodyParams, IWriteSonicChatMetadataParams, IWriteSonicChatService, IWriteSonicHistoryData, WriteSonicEngine, WriteSonicLang } from './chat.interface.js';
import api from 'api';

export class WriteSonicChatService implements IWriteSonicChatService {
	private readonly sdk;
	private readonly bodyParams: IWriteSonicChatBodyParams;
	private readonly metadataParams: IWriteSonicChatMetadataParams;
	private readonly writeSonicApiKey: string;

	constructor() {
		this.sdk = api('@writesonic/v2.2#4enbxztlcbti48j');

		this.writeSonicApiKey = '';

		this.bodyParams = {
			enable_google_results: true,
			enable_memory: true,
			input_text: '',
			history_data: [],
		};

		this.metadataParams = {
			engine: WriteSonicEngine.PREMIUM,
			language: WriteSonicLang.EN
		};
	}

	// tslint:disable-next-line: max-line-length
	public async textRequest(user: string, prompt: string, historyData: IWriteSonicHistoryData[]): Promise<AiTextResponse> {

		this.bodyParams.input_text = prompt;
		this.bodyParams.history_data = historyData;

		this.sdk.auth(this.writeSonicApiKey);
		const res = await this.sdk.chatsonic_V2BusinessContentChatsonic_post(this.bodyParams, this.metadataParams);

		return {
			status: AiResponseStatus.SUCCESS,
			finishReason: '',
			payload: res
		};
	}
}

