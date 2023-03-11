import { IDbServiceResponse, IUsersTable } from './mysql.interface.js';

export interface IUserStorageSevice {
	create(data: IUsersTable): Promise<IDbServiceResponse>;
	// tslint:disable-next-line: no-any
	getAll(fields: any[]): Promise<IDbServiceResponse>;
	getById(id: number): Promise<IDbServiceResponse>;
}