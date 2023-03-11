import { IUserStorageSevice } from './users.interface.js';
import { Kysely } from 'kysely';
import { DbResponseStatus, IDatabase, IDbServiceResponse, IUsersTable } from './mysql.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';

export class UsersSrorageService implements IUserStorageSevice {
	constructor(
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly logger: ILogger,
		private readonly utils: IUtils,
	) { }

	public async create(data: IUsersTable): Promise<IDbServiceResponse> {

		const payload = Object(data);

		let res;

		try {
			res = await this.dbConnection
				.insertInto('users')
				.values(payload)
				.execute();

			return {
				status: DbResponseStatus.SUCCESS,
				payload: res
			};

		} catch (error) {
			let errMsg = '';
			if (error instanceof Error) {
				errMsg = `Error (createUser): ${error.message}`;
				this.logger.error(errMsg);

			} else {
				errMsg = `Unknown error (createUser)`;
			}

			return {
				status: DbResponseStatus.ERROR,
				payload: errMsg
			};
		}

	}

	// tslint:disable-next-line: no-any
	public async getAll(fields: any[]): Promise<IDbServiceResponse> {
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
			this.utils.errorLog(error);

			return {
				status: DbResponseStatus.ERROR,
				payload: 'Error'
			};
		}
	}

	getById(id: number): Promise<IDbServiceResponse> {
		throw new Error('Method not implemented.');
	}

}