import { IDbServiceResponse } from './mysql.interface.js';

export interface IServiceUsageStorageSevice {
	// tslint:disable-next-line: no-any
	create: (data: any) => Promise<IDbServiceResponse>;
	getByUserGuid: (userGuid: string) => Promise<IDbServiceResponse>;
}