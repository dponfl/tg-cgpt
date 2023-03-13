import exp from 'constants';
import { Generated } from 'kysely';
import { IGTStorageService } from './gt.interface.js';
import { IUserStorageSevice } from './users.interface.js';

export enum DbResponseStatus {
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR',
}

export enum GroupTransactionType {
	DEPOSIT = 'DEPOSIT',
	WITHDRAWAL = 'DEPOSIT',
}

export enum GroupTransactionServiceName {
	GPT = 'GPT',
	MJ = 'MJ',
	GPT_MJ = 'GPT_MJ',
}

export enum GroupTransactionPaymentStatus {
	SUCCESS = 'SUCCESS',
	PROCESSING = 'PROCESSING',
	FAILED = 'FAILED',
	DECLINED = 'DECLINED',
}

export enum GroupTransactionPaymentProvider {
	ROBOKASSA = 'ROBOKASSA',
}

export enum GroupTransactionCurrency {
	RUB = 'RUB',
}


export interface IDbServices {
	usersDbService?: IUserStorageSevice;
	gtDbService?: IGTStorageService;
}

export interface IDbServiceResponse {
	status: DbResponseStatus;
	// tslint:disable-next-line: no-any
	payload?: any;
}

export interface IUsersTable {
	id?: Generated<number>;
	createdAt: string;
	updatedAt: string;
	guid: string;
	firstname: string;
	firstname_c: string;
	surname: string;
	surname_c: string;
	username: string;
	fromId: string | number;
	chatId: string | number;
	region: string;
	country: string;
	messenger: string; // Messenger
	clientUnreachable: boolean;
	clientUnreachableDetails: string;
	deleted: boolean;
	banned: boolean;
	lang: string;
}

export interface IGroupTransactionTable {
	id?: Generated<number>;
	createdAt: string;
	updatedAt: string;
	guid: string;
	type: string; // GroupTransactionType
	serviceName: string; // GroupTransactionServiceName
	purchasedQty: string;
	status: string; // GroupTransactionPaymentStatus
	amount: number;
	currency: string; // GroupTransactionCurrency
	paymentProvider: string; // GroupTransactionPaymentProvider
	messenger: string; // Messenger
	paymentLink: string;
	userGuid: string;
	comments: string;
}

export interface IDatabase {
	users: IUsersTable;
	groupTransactions: IGroupTransactionTable;
}