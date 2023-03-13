import { createHash } from 'crypto';
import { IConfigService } from '../config/config.interface.js';
import { GeneralServiceResponseStatus } from '../types.js';
import { IUtils } from '../utils/utils.class.js';
import { IGetPaymentLinkRequest, IHashData, IPaymentResponse, IPaymentService } from './payments.interface.js';

export class RobokassaService implements IPaymentService {

	private readonly baseUrl: string;
	private readonly apiName: string;
	private readonly apiAction: string;
	private readonly hashingAlgorithm: string;

	constructor(
		private readonly configService: IConfigService,
		private readonly utils: IUtils
	) {
		this.baseUrl = configService.get('PAYMENT_MS_URL');
		this.apiName = 'robokassa';
		this.apiAction = 'payment';
		this.hashingAlgorithm = 'md5';
	}
	async getPaymentLink(params: IGetPaymentLinkRequest): Promise<IPaymentResponse> {
		try {
			const res: IPaymentResponse = Object();

			/**
			 * Создаём записи в таблицах платежей
			 */

			/**
			 * Делаем запрос на получение платёжного линка
			 */

			const hashData: IHashData = {
				amount: params.amount,
				orderId: 5000, // paymentGroupRec.id,
				cid: 'cidXXX', // client.guid,
				aid: 'aidXXX', // currentAccount.guid,
				gtid: 'gtid', // paymentGroupRec.guid,
			};

			const signature = await this.calculateHash(hashData);

			const requestParams: IGetPaymentLinkRequest = {
				signature,
				amount: params.amount,
				description: params.description,
				orderId: 5000,
				cid: params.cid,
				aid: params.aid,
				gtid: params.gtid,
				isTest: true
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