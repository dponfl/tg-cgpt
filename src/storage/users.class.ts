import { IUserStorageSevice } from './users.interface.js';
import { Kysely } from 'kysely';
import { DbResponseStatus, IDatabase, IDbServiceResponse, IUsersTable } from './mysql.interface.js';
import { ILogger } from '../logger/logger.interface.js';

export class UsersSrorageService implements IUserStorageSevice {
	constructor(
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly logger: ILogger
	) { }

	public async createUser(data: IUsersTable): Promise<IDbServiceResponse> {

		this.logger.info('10');

		const payload = Object(data);

		this.logger.info('11');

		let res;

		try {
			res = await this.dbConnection
				.insertInto('users')
				.values(payload)
				.returningAll()
				.execute();

			this.logger.info('12');

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

	getUserById(id: number): Promise<IDbServiceResponse> {
		throw new Error('Method not implemented.');
	}

}