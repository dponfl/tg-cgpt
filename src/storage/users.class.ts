import { IUserStorageSevice } from './users.interface.js';
import { Kysely } from 'kysely';
import { DbResponseStatus, IDatabase, IDbServiceResponse, IUsersTable } from './mysql.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';

export class UsersStorageService implements IUserStorageSevice {
	constructor(
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly logger: ILogger,
		private readonly utils: IUtils,
	) { }

	public async create(data: IUsersTable): Promise<IDbServiceResponse> {

		const methodName = 'create';

		try {

			const payload = Object(data);

			const res = await this.dbConnection
				.insertInto('users')
				.values(payload)
				.execute();

			return {
				status: DbResponseStatus.SUCCESS,
				payload: res
			};

		} catch (error) {
			const errMsg = this.utils.errorLog(error, methodName);
			return {
				status: DbResponseStatus.ERROR,
				payload: errMsg
			};
		}

	}

	// tslint:disable-next-line: no-any
	public async getAll(fields: any[]): Promise<IDbServiceResponse> {
		const methodName = 'getAll';
		try {

			const res = await this.dbConnection
				.selectFrom('users')
				.select(fields)
				.execute();

			return {
				status: DbResponseStatus.SUCCESS,
				payload: res
			};

		} catch (error) {
			const errMsg = this.utils.errorLog(error, methodName);

			return {
				status: DbResponseStatus.ERROR,
				payload: errMsg
			};
		}
	}

	getById(id: number): Promise<IDbServiceResponse> {
		throw new Error('Method not implemented.');
	}

}