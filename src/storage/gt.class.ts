import { Kysely } from 'kysely';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { IGTStorageService } from './gt.interface.js';
import { IGroupTransactionTable, IDbServiceResponse, IDatabase, DbResponseStatus } from './mysql.interface.js';

export class GtStorageService implements IGTStorageService {

	constructor(
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly logger: ILogger,
		private readonly utils: IUtils,
	) { }

	public async create(data: IGroupTransactionTable): Promise<IDbServiceResponse> {
		const methodName = 'create';

		try {
			const payload = Object(data);
			await this.dbConnection
				.insertInto('groupTransactions')
				.values(payload)
				.execute();

			const resultRaw = await this.dbConnection
				.selectFrom('groupTransactions')
				.selectAll()
				.where('guid', '=', data.guid)
				.execute();

			// TODO: delete
			this.logger.warn(`resultRaw: ${JSON.stringify(resultRaw, null, 2)}`);

			if (resultRaw) {
				return {
					status: DbResponseStatus.SUCCESS,
					payload: resultRaw,
				};
			} else {
				return {
					status: DbResponseStatus.ERROR,
					payload: `ERROR: No data returned on insert`,
				};
			}

		} catch (error) {
			const errMsg = this.utils.errorLog(error, methodName);
			return {
				status: DbResponseStatus.ERROR,
				payload: errMsg
			};
		}
	}

}