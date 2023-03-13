import { createHash } from 'crypto';
import { IConfigService } from '../config/config.interface.js';
import { HttpDataFormat, HttpRequestMethod, IHttpPostRequestOptions, IHttpRequest, IHttpService } from '../http/http.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { GeneralServiceResponseStatus } from '../types.js';
import { IUtils } from '../utils/utils.class.js';
import { IGetPaymentLinkHttpRequest, IGetPaymentLinkParams, IHashData, IPaymentResponse, IPaymentService } from './payments.interface.js';

export class RobokassaService implements IPaymentService {

	private readonly baseUrl: string;
	private readonly apiName: string;
	private readonly apiAction: string;
	private readonly hashingAlgorithm: string;

	constructor(
		private readonly configService: IConfigService,
		private readonly logger: ILogger,
		private readonly utils: IUtils,
		private readonly httpService: IHttpService
	) {
		this.baseUrl = configService.get('PAYMENT_MS_URL');
		this.apiName = 'robokassa';
		this.apiAction = 'payment';
		this.hashingAlgorithm = 'md5';
	}
	async getPaymentLink(params: IGetPaymentLinkParams): Promise<IPaymentResponse> {
		try {
			const res: IPaymentResponse = Object();

			/**
			 * Создаём записи в таблицах платежей
			 */

			/**
			 * Делаем запрос на получение платёжного линка
			 */

			const orderId: number = 5000;

			const hashData: IHashData = {
				amount: params.amount,
				orderId, // paymentGroupRec.id,
				cid: 'cidXXX', // client.guid,
				aid: 'aidXXX', // currentAccount.guid,
				gtid: 'gtid', // paymentGroupRec.guid,
			};

			const signature = await this.calculateHash(hashData);

			const requestParams: IGetPaymentLinkHttpRequest = {
				signature,
				amount: params.amount,
				description: params.description,
				orderId,
				cid: params.cid,
				aid: params.aid,
				gtid: params.gtid,
				isTest: true,
			};

			const options: IHttpPostRequestOptions = {
				method: HttpRequestMethod.POST,
				body: JSON.stringify(requestParams),
				dataFormat: HttpDataFormat.json
			};

			const httpParams: IHttpRequest = {
				url: `${this.baseUrl}/${this.apiName}/${this.apiAction}`,
				options,
			};


			return res;
		} catch (error) {
			return Object({
				status: GeneralServiceResponseStatus.ERROR,
				payload: this.utils.errorLog(error)
			});
		}

	}

	async calculateHash(params: IHashData): Promise<string> {
		try {
			let calculatedHash: string;

			const values: string[] = [];

			values.push(this.configService.get('INTER_MS_PW'));

			for (const key in params) {
				if (params[key as keyof IHashData]) {
					values.push(`${key}=${params[key as keyof IHashData]}`);
				}
			}

			const hash = createHash(this.hashingAlgorithm);

			hash.update(values.join(':'));

			calculatedHash = hash.digest('hex');

			return calculatedHash;
		} catch (error) {
			throw new Error(this.utils.errorLog(error));
		}
	}

}