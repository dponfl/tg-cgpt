import { IDbServiceResponse, IUsersTable } from './mysql.interface.js';

export interface IUserStorageSevice {
	// tslint:disable-next-line: no-any
	create: (data: any) => Promise<IDbServiceResponse>;
	// tslint:disable-next-line: no-any
	getAll: (fields: any[]) => Promise<IDbServiceResponse>;
	getByGuid: (guid: string) => Promise<IDbServiceResponse>;
	getById: (id: number) => Promise<IDbServiceResponse>;
	getByTelegramIds: (chatId: number, fromId: number) => Promise<IDbServiceResponse>;
}