import fetch, { Headers, Response } from 'node-fetch';
import { ILogger } from '../logger/logger.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { HttpDataFormat, HttpResponseStatus, IHttpRequest, IHttpResponse, IHttpService } from './http.interface.js';

export class HttpService implements IHttpService {

	constructor(
		private readonly logger: ILogger,
		private readonly utils: IUtils
	) { }

	async get(params: IHttpRequest): Promise<IHttpResponse> {
		try {
			let res: Response;

			if (params.options) {
				res = await fetch(params.url, params.options);
			} else {
				res = await fetch(params.url);
			}

			const data = params.options?.dataFormat === HttpDataFormat.json ? await res.json() : await res.text();

			return {
				status: res.status === 200 ? HttpResponseStatus.SUCCESS : HttpResponseStatus.ERROR,
				payload: data,
			};
		} catch (error) {
			throw new Error(this.utils.errorLog(error));
		}
	}
	async post(params: IHttpRequest): Promise<IHttpResponse> {
		try {
			let res: Response;
			if (params.options) {
				if (params.options.dataFormat === HttpDataFormat.json) {
					this.logger.info(`params.options.headers [1]: ${JSON.stringify(params.options.headers, null, 2)}`);
					const meta = {
						'Content-Type': 'text/xml',
						'Accept': '123'
					};
					params.options.headers = new Headers(meta);
					params.options.headers = { ...params.options.headers, ...{ 'Content-Type': 'application/json' } };
					this.logger.info(`params.options.headers [2]: ${JSON.stringify(params.options.headers, null, 2)}`);
				}
				res = await fetch(params.url, params.options);
			} else {
				throw new Error(`Error: POST request with no options parameter`);
			}

			const data = params.options?.dataFormat === HttpDataFormat.json ? await res.json() : await res.text();

			return {
				status: res.status === 200 ? HttpResponseStatus.SUCCESS : HttpResponseStatus.ERROR,
				payload: data,
			};
		} catch (error) {
			throw new Error(this.utils.errorLog(error));
		}
	}

}