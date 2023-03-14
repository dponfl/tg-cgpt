import { createHash, randomUUID } from 'crypto';
import { Kysely } from 'kysely';
import moment from 'moment';
import { IConfigService } from '../config/config.interface.js';
// tslint:disable-next-line: max-line-length
import { HttpDataFormat, HttpRequestMethod, HttpResponseStatus, IHttpPostRequestOptions, IHttpRequest, IHttpService } from '../http/http.interface.js';
import { ILogger } from '../logger/logger.interface.js';
// tslint:disable-next-line: max-line-length
import { DbResponseStatus, GroupTransactionPaymentProvider, GroupTransactionPaymentStatus, GroupTransactionType, IDatabase, IDbServices, IGroupTransactionTable } from '../storage/mysql.interface.js';
import { GeneralServiceResponseStatus, Messenger } from '../types.js';
import { IUtils } from '../utils/utils.class.js';
// tslint:disable-next-line: max-line-length
import { IGetPaymentLinkHttpPayload, IGetPaymentLinkHttpRequest, IGetPaymentLinkParams, IGetPaymentLinkResponse, IHashData, IPaymentService } from './payments.interface.js';

export class RobokassaService implements IPaymentService {

	private readonly baseUrl: string;
	private readonly apiName: string;
	private readonly apiAction: string;
	private readonly hashingAlgorithm: string;

	constructor(
		private readonly configService: IConfigService,
		private readonly logger: ILogger,
		private readonly utils: IUtils,
		private readonly httpService: IHttpService,
		private readonly dbConnection: Kysely<IDatabase>,
	) {
		this.baseUrl = configService.get('PAYMENT_MS_URL');
		this.apiName = 'robokassa';
		this.apiAction = 'payment';
		this.hashingAlgorithm = 'md5';
	}
	async getPaymentLink(params: IGetPaymentLinkParams): Promise<IGetPaymentLinkResponse | undefined> {
		const methodName = 'getPaymentLink';
		try {
			const res: IGetPaymentLinkResponse = Object();

			/**
			 * Проверяем наличие неиспользованных платёжных линков для переиспользования
			 */

			const gtRecs = await this.dbConnection
				.selectFrom('groupTransactions')
				.selectAll()
				.where('userGuid', '=', params.uid)
				.where('status', '=', GroupTransactionPaymentStatus.PROCESSING)
				.where('serviceName', '=', params.serviceName as string)
				.where('purchasedQty', '=', params.purchasedQty as string)
				.where('amount', '=', params.amount)
				.where('currency', '=', params.currency as string)
				.where('type', '=', GroupTransactionType.DEPOSIT)
				.execute();

			// TODO: delete
			this.logger.warn(`gtRecs: ${JSON.stringify(gtRecs, null, 2)}`);

			if (
				gtRecs
				&& Array.isArray(gtRecs)
				&& gtRecs.length > 0
			) {
				const { paymentLink } = gtRecs[gtRecs.length - 1];

				if (!paymentLink) {
					this.logger.error(`ERROR: No paymentLink at gt rec: ${gtRecs[gtRecs.length - 1]}`);
				} else {
					res.url = paymentLink;
					return res;
				}
			}



			/**
			 * Создаём записи в таблицах платежей
			 */

			const guid = randomUUID();

			const gtCreateParams: IGroupTransactionTable = {
				createdAt: moment().utc().format(),
				updatedAt: moment().utc().format(),
				guid,
				type: GroupTransactionType.DEPOSIT,
				serviceName: params.serviceName as string,
				purchasedQty: params.purchasedQty as string,
				status: GroupTransactionPaymentStatus.PROCESSING,
				amount: params.amount,
				currency: params.currency as string,
				paymentProvider: GroupTransactionPaymentProvider.ROBOKASSA,
				messenger: Messenger.TELEGRAM,
				paymentLink: '',
				userGuid: params.uid,
				comments: ''
			};

			// const gtRaw = await this.dbServices.gtDbService?.create(gtCreateParams);

			const createRecParams = Object(gtCreateParams);

			await this.dbConnection
				.insertInto('groupTransactions')
				.values(createRecParams)
				.execute();

			const resultRaw = await this.dbConnection
				.selectFrom('groupTransactions')
				.selectAll()
				.where('guid', '=', guid)
				.execute();

			if (!resultRaw) {
				throw new Error(`ERROR: create groupTransaction record error`);
			}

			const { id } = resultRaw[0];

			/**
			 * Делаем запрос на получение платёжного линка
			 */

			if (!id) {
				throw new Error(`ERROR: No "id" at create rec result: ${resultRaw[0]}`);
			}

			const orderId: number = id;

			const hashData: IHashData = {
				amount: params.amount,
				orderId,
				uid: params.uid,
				gtid: guid,
			};

			const signature = await this.calculateHash(hashData);

			const requestParams: IGetPaymentLinkHttpRequest = {
				signature,
				amount: params.amount,
				description: params.description,
				orderId,
				uid: params.uid,
				gtid: guid,
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

			const resRaw = await this.httpService.post(httpParams);

			if (resRaw.status !== HttpResponseStatus.SUCCESS) {
				return undefined;
			}

			const { url } = resRaw.payload as IGetPaymentLinkHttpPayload;

			this.dbConnection
				.updateTable('groupTransactions')
				.set({
					paymentLink: url,
					updatedAt: moment().utc().format()
				})
				.where('guid', '=', guid)
				.execute();

			res.url = url;

			return res;

		} catch (error) {
			return Object({
				status: GeneralServiceResponseStatus.ERROR,
				payload: this.utils.errorLog(error, methodName)
			});
		}

	}

	async calculateHash(params: IHashData): Promise<string> {
		const methodName = 'calculateHash';
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
			throw new Error(this.utils.errorLog(error, methodName));
		}
	}

}