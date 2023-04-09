import { IDbServiceResponse } from './mysql.interface.js';

export interface IRequestService {
	// tslint:disable-next-line: no-any
	create: (data: any) => Promise<IDbServiceResponse>;
}