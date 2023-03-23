import { Kysely } from 'kysely';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { DbResponseStatus, IDatabase, IDbServiceResponse, IRequestsTable } from './mysql.interface.js';
import { IRequestService } from './requests.interface.js';
import { randomUUID } from 'crypto';
import moment from 'moment';


export class RequestStorageService implements IRequestService {
	constructor(
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly logger: ILogger,
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

			const createRequest: IRequestsTable = {
				guid,
				createdAt: moment().utc().format(),
				updatedAt: moment().utc().format(),
				userGuid: data.userGuid,
				system: data.system ?? '',
				subsystem: data.subsystem ?? '',
				requestType: data.requestType ?? 0,
				requestStatus: data.requestStatus ?? '',
				requestWords: data.requestWords ?? 0,
				requestTokens: data.requestTokens ?? 0,
				responseWords: data.responseWords ?? 0,
				responseTokens: data.responseTokens ?? 0,
				totalTokens: data.totalTokens ?? 0,
				duration: data.duration ?? 0
			};


			const payload = Object(createRequest);

			await this.dbConnection
				.insertInto('requests')
				.values(payload)
				.execute();

			const resRaw = await this.dbConnection
				.selectFrom('requests')
				.selectAll()
				.where('guid', '=', guid)
				.execute();

			if (
				!resRaw
				|| !Array.isArray(resRaw)
				|| resRaw.length !== 1
			) {
				// tslint:disable-next-line: max-line-length
				throw new Error(`Could not create request record for data=${JSON.stringify(data)}, result:\n${JSON.stringify(resRaw)}`);
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
}