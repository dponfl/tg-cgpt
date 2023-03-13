import { Sticker } from 'telegraf/types';
import { IGeneralServiceResponse } from '../types.js';

export interface IPaymentResponse extends IGeneralServiceResponse {
	payload?: IGetPaymentLinkResponse;
}

export interface IGetPaymentLinkHttpRequest extends IGetPaymentLinkParams {
	signature: string;
	orderId: number;
	isTest: boolean;
}

export interface IGetPaymentLinkParams {
	amount: number;
	description: string;
	cid: string;
	aid: string;
	gtid: string;
}

export interface IGetPaymentLinkResponse {
	url: string;
}

export interface IHashData {
	amount: number;
	orderId: number;
	cid: string;
	aid: string;
	gtid: string;
}

export interface IPaymentService {
	getPaymentLink(params: IGetPaymentLinkParams): Promise<IGetPaymentLinkResponse | undefined>;
	calculateHash(params: IHashData): Promise<string>;
}