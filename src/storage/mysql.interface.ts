import { Generated } from 'kysely';
import { IGTStorageService } from './gt.interface.js';
import { IRequestService } from './requests.interface.js';
import { IServiceUsageStorageSevice } from './service.interface.js';
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

export enum Systems {
	CHATGPT = 'ChatGPT',
	MIDJOURNEY = 'Midjourney',
	WRITESONIC = 'WriteSonic',
	DEEPL = 'DeepL',
}

export enum SubSustems {
	CHAT = 'chat',
	TRANSLATION = 'translation',
}

export enum RequestTypes {
	ORDINARY = 'ordinary',
	STREAM = 'stream',
}

export enum RequestStatus {
	SUCCESS = 'success',
	ERROR = 'error',
	TIMEOUT = 'timeout',
}


export interface IDbServices {
	usersDbService?: IUserStorageSevice;
	gtDbService?: IGTStorageService;
	serviceUsageDbService?: IServiceUsageStorageSevice;
	requestsDbService?: IRequestService;
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

export interface IServiceUsageTable {
	id?: Generated<number>;
	createdAt: string;
	updatedAt: string;
	guid: string;
	userGuid: string;
	gptPurchased: number;
	gptUsed: number;
	gptLeft: number;
	gptFreeReceived: number;
	gptFreeUsed: number;
	gptFreeLeft: number;
	mjPurchased: number;
	mjUsed: number;
	mjLeft: number;
	mjFreeReceived: number;
	mjFreeUsed: number;
	mjFreeLeft: number;
}

export interface IRequestsTable {
	id?: Generated<number>;
	createdAt?: string;
	updatedAt?: string;
	guid?: string;
	userGuid: string;
	system: string; // Systems;
	subsystem: string; // SubSustems;
	requestType: string; // RequestTypes;
	requestStatus: string; // RequestStatus
	requestWords?: number;
	requestTokens?: number;
	responseWords?: number;
	responseTokens?: number;
	totalTokens?: number;
	duration: number;
}

export interface IDatabase {
	users: IUsersTable;
	groupTransactions: IGroupTransactionTable;
	serviceUsage: IServiceUsageTable;
	requests: IRequestsTable;
}