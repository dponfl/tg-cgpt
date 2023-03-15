import { GroupTransactionServiceName } from '../storage/mysql.interface.js';
import { IGeneralServiceResponse } from '../types.js';

export interface IPaymentResponse extends IGeneralServiceResponse {
	payload?: IGetPaymentLinkResponse;
}

export interface IGetPaymentLinkHttpRequest extends IGetPaymentLinkParams {
	signature: string;
	orderId: number;
	gtid: string;
	isTest: boolean;
}

export interface IGetPaymentLinkParams {
	amount: number;
	description: string;
	uid: string;
	serviceName?: GroupTransactionServiceName;
	purchasedQty?: string;
	currency?: string;
}

export interface IGetPaymentLinkHttpPayload {
	status: string;
	url: string;
}

export interface IGetPaymentLinkResponse {
	url: string;
}

export interface IHashData {
	amount: number;
	orderId: number;
	uid: string;
	gtid: string;
}

export interface IPaymentProcessingParams {
	signature?: string;
	amount: number;
	orderId: string;
	uid: string;
	gtid: string;
}

export interface IPaymentProcessingService {
	processSuccessfulPayment(params: IPaymentProcessingParams): any;
	processFailedPayment(params: IPaymentProcessingParams): any;
}

export interface IPaymentService {
	getPaymentLink(params: IGetPaymentLinkParams): Promise<IGetPaymentLinkResponse | undefined>;
	calculateHash(params: IHashData): Promise<string>;
}