import { IDbServiceResponse, IUsersTable } from './mysql.interface.js';

export interface IUserStorageSevice {
	createUser(data: IUsersTable): Promise<IDbServiceResponse>;
	getUserById(id: number): Promise<IDbServiceResponse>;
}