import { BodyInit, RequestInit } from 'node-fetch';

export enum HttpResponseStatus {
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR'
}

export enum HttpRequestMethod {
	GET = 'GET',
	POST = 'POST',
}

export enum HttpDataFormat {
	text = 'text',
	json = 'json',
}

export interface IHttpRequestOptions extends RequestInit {
	method: HttpRequestMethod;
	dataFormat: HttpDataFormat;
}

export interface IHttpGetRequestOptions extends IHttpRequestOptions {
}

export interface IHttpPostRequestOptions extends IHttpRequestOptions {
	body: BodyInit | null;
}

export interface IHttpRequest {
	url: string;
	options?: IHttpGetRequestOptions | IHttpPostRequestOptions;
}

export interface IHttpResponse {
	status: HttpResponseStatus;
	payload?: unknown;
}

export interface IHttpService {
	get(params: IHttpRequest): Promise<IHttpResponse>;
	post(params: IHttpRequest): Promise<IHttpResponse>;
}
