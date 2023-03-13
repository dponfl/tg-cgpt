import { Sticker } from 'telegraf/types';
import { IGeneralServiceResponse } from '../types.js';

export interface IPaymentResponse extends IGeneralServiceResponse {
	payload?: IGetPaymentLinkResponse;
}

export interface IGetPaymentLinkRequest {
	signature: string;
	amount: number;
	description: string;
	orderId: number;
	cid: string;
	aid: string;
	gtid: string;
	isTest: boolean;
}

export interface IGetPaymentLinkResponse {

}

export interface IHashData {
	amount: number;
	orderId: number;
	cid: string;
	aid: string;
	gtid: string;
}

export interface IPaymentService {
	getPaymentLink(params: IGetPaymentLinkRequest): Promise<IPaymentResponse>;
	calculateHash(params: IHashData): Promise<string>;
}