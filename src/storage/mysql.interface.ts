import { Generated } from 'kysely';
import { IUserStorageSevice } from './users.interface.js';

export enum DbResponseStatus {
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR'
}


export interface IDbServices {
	usersDbService?: IUserStorageSevice;
}

export interface IDbServiceResponse {
	status: DbResponseStatus;
	payload?: any;
}

export interface IUsersTable {
	id?: Generated<number>;
	guid: string;
	firstname: string;
	surname: string;
	username: string;
	fromId: string | number;
	chatId: string | number;
	region: string;
	country: string;
	messenger: string;
	clientUnreachable: boolean;
	clientUnreachableDetails: string;
	deleted: boolean;
	banned: boolean;
	lang: string;
}

export interface IDatabase {
	users: IUsersTable;
}