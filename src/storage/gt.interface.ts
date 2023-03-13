import { IDbServiceResponse, IGroupTransactionTable } from './mysql.interface.js';

export interface IGTStorageService {
	create(data: IGroupTransactionTable): Promise<IDbServiceResponse>;
}