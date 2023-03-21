import { IUserStorageSevice } from './users.interface.js';
import { Kysely } from 'kysely';
import { DbResponseStatus, IDatabase, IDbServiceResponse, IUsersTable } from './mysql.interface.js';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { randomUUID } from 'crypto';
import moment from 'moment';

export class UsersStorageService implements IUserStorageSevice {
	constructor(
		private readonly dbConnection: Kysely<IDatabase>,
		private readonly logger: ILogger,
		private readonly utils: IUtils,
	) { }

	// tslint:disable-next-line: no-any
	public async create(data: any): Promise<IDbServiceResponse> {

		const methodName = 'create';

		try {

			let guid: string;

			if (!data.guid) {
				guid = randomUUID();
			} else {
				guid = data.guid;
			}

			const userRec: IUsersTable = {
				guid,
				createdAt: moment().utc().format(),
				updatedAt: moment().utc().format(),
				firstname: data.firstname ?? '',
				firstname_c: data.firstname_c ?? '',
				surname: data.surname ?? '',
				surname_c: data.surname_c ?? '',
				username: data.username ?? '',
				fromId: data.fromId ?? '',
				chatId: data.chatId ?? '',
				region: data.region ?? '',
				country: data.country ?? '',
				messenger: data.messenger ?? '',
				clientUnreachable: false,
				clientUnreachableDetails: '',
				deleted: false,
				banned: false,
				lang: data.lang ?? 'ru',
			};


			const payload = Object(userRec);

			await this.dbConnection
				.insertInto('users')
				.values(payload)
				.execute();

			const resRaw = await this.dbConnection
				.selectFrom('users')
				.selectAll()
				.where('guid', '=', guid)
				.execute();

			if (
				!resRaw
				|| !Array.isArray(resRaw)
				|| resRaw.length !== 1
			) {
				// tslint:disable-next-line: max-line-length
				throw new Error(`Could not create user record for data:\n${JSON.stringify(data)}, result:\n${JSON.stringify(resRaw)}`);
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
			const errMsg = this.utils.errorLog(this, error, methodName);

			return {
				status: DbResponseStatus.ERROR,
				payload: errMsg
			};
		}
	}

	public async getByGuid(guid: string): Promise<IDbServiceResponse> {

		const methodName = 'getUserByGuid';

		try {

			const userRecRaw = await this.dbConnection
				.selectFrom('users')
				.selectAll()
				.where('guid', '=', guid)
				.execute();

			if (
				!userRecRaw
				|| !Array.isArray(userRecRaw)
				|| userRecRaw.length !== 1
			) {
				throw new Error(`No or several user recs for userGuid=${guid}`);
			}

			return {
				status: DbResponseStatus.SUCCESS,
				payload: userRecRaw[0]
			};

		} catch (error) {
			const errMsg = this.utils.errorLog(this, error, methodName);

			return {
				status: DbResponseStatus.ERROR,
				payload: errMsg
			};

		}
	}

	public async getById(id: number): Promise<IDbServiceResponse> {

		const methodName = 'getById';

		try {

			const userRecRaw = await this.dbConnection
				.selectFrom('users')
				.selectAll()
				.where('id', '=', id)
				.execute();

			if (
				!userRecRaw
				|| !Array.isArray(userRecRaw)
				|| userRecRaw.length !== 1
			) {
				throw new Error(`No or several user recs for id=${id}`);
			}

			return {
				status: DbResponseStatus.SUCCESS,
				payload: userRecRaw[0]
			};

		} catch (error) {
			const errMsg = this.utils.errorLog(this, error, methodName);

			return {
				status: DbResponseStatus.ERROR,
				payload: errMsg
			};

		}
	}

	public async getByTelegramIds(chatId: number, fromId: number): Promise<IDbServiceResponse> {

		const methodName = 'getByTelegramIds';

		try {

			const userRecRaw = await this.dbConnection
				.selectFrom('users')
				.selectAll()
				.where('fromId', '=', fromId)
				.where('chatId', '=', chatId)
				.execute();

			if (
				!userRecRaw
				|| !Array.isArray(userRecRaw)
				|| userRecRaw.length !== 1
			) {
				this.logger.warn(`None or several user recs for chatId=${chatId} and fromId=${fromId}, result:\n${JSON.stringify(userRecRaw)}`);

				return {
					status: DbResponseStatus.ERROR,
					payload: `None or several user recs for chatId=${chatId} and fromId=${fromId}, result:\n${JSON.stringify(userRecRaw)}`
				};
			}

			return {
				status: DbResponseStatus.SUCCESS,
				payload: userRecRaw[0]
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