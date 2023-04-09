import { Kysely } from 'kysely';
import { DbResponseStatus, IDatabase, IDbServiceResponse, IServiceUsageTable } from './mysql.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { randomUUID } from 'crypto';
import moment from 'moment';
import { IServiceUsageStorageSevice } from './service.interface.js';
import { IConfigService } from '../config/config.interface.js';

export class ServiceUsageStorageService implements IServiceUsageStorageSevice {
	constructor(
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly logger: ILogger,
		public readonly configService: IConfigService,
		private readonly utils: IUtils,
	) { }

	// tslint:disable-next-line: no-any
	public async create(data: any): Promise<IDbServiceResponse> {

		const methodName = 'create';

		try {

			if (!data.userGuid) {
				throw new Error(`No userGuid at provided data:\n${JSON.stringify(data)}`);
			}

			let guid: string;

			if (!data.guid) {
				guid = randomUUID();
			} else {
				guid = data.guid;
			}

			const createServiceUsage: IServiceUsageTable = {
				guid,
				createdAt: moment().utc().format(),
				updatedAt: moment().utc().format(),
				userGuid: data.userGuid,
				gptPurchased: 0,
				gptUsed: 0,
				gptLeft: 0,
				gptFreeReceived: Number(this.configService.get('PACKAGE_GPT_FREE_QTY')),
				gptFreeUsed: 0,
				gptFreeLeft: Number(this.configService.get('PACKAGE_GPT_FREE_QTY')),
				mjPurchased: 0,
				mjUsed: 0,
				mjLeft: 0,
				mjFreeReceived: Number(this.configService.get('PACKAGE_MJ_FREE_QTY')),
				mjFreeUsed: 0,
				mjFreeLeft: Number(this.configService.get('PACKAGE_MJ_FREE_QTY')),
			};


			const payload = Object(createServiceUsage);

			await this.dbConnection
				.insertInto('serviceUsage')
				.values(payload)
				.execute();

			const resRaw = await this.dbConnection
				.selectFrom('serviceUsage')
				.selectAll()
				.where('guid', '=', guid)
				.execute();

			if (
				!resRaw
				|| !Array.isArray(resRaw)
				|| resRaw.length !== 1
			) {
				// tslint:disable-next-line: max-line-length
				throw new Error(`Could not create service usage record for data=${JSON.stringify(data)}, result:\n${JSON.stringify(resRaw)}`);
			}


			return {
				status: DbResponseStatus.SUCCESS,
				payload: resRaw[0]
			};

		} catch (error) {
			const errMsg = this.utils.errorLog(this, error, methodName);
			return {
				status: DbResponseStatus.ERROR,
				payload: errMsg
			};
		}

	}

	public async getByUserGuid(userGuid: string): Promise<IDbServiceResponse> {

		const methodName = 'getByUserGuid';

		try {

			const serviceUsageRecRaw = await this.dbConnection
				.selectFrom('serviceUsage')
				.selectAll()
				.where('userGuid', '=', userGuid)
				.execute();

			if (
				!serviceUsageRecRaw
				|| !Array.isArray(serviceUsageRecRaw)
				|| serviceUsageRecRaw.length !== 1
			) {
				this.logger.warn(`None or several service usage recs for userGuid=${userGuid}`);

				return {
					status: DbResponseStatus.ERROR,
					payload: `None or several service usage recs for userGuid=${userGuid}`
				};

			}

			return {
				status: DbResponseStatus.SUCCESS,
				payload: serviceUsageRecRaw[0]
			};

		} catch (error) {
			const errMsg = this.utils.errorLog(this, error, methodName);

			return {
				status: DbResponseStatus.ERROR,
				payload: errMsg
			};

		}
	}

}