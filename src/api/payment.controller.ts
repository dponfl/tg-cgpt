import { ILogger } from '../logger/logger.interface.js';
import { BaseController } from './base.controller.js';
import { NextFunction, Request, Response } from 'express';
// tslint:disable-next-line: max-line-length
import { IHashData, IPaymentProcessingParams, IPaymentProcessingService, IPaymentService } from '../payments/payments.interface.js';

export class PaymentProcessingController extends BaseController {
	constructor(
		public readonly logger: ILogger,
		private readonly paymentProcessingService: IPaymentProcessingService,
		private readonly robokassaService: IPaymentService
	) {
		super(logger);
		this.bindRoutes([
			{ path: '/success', method: 'post', func: this.success },
			{ path: '/fail', method: 'post', func: this.fail },
		]);
	}

	public success(req: Request, res: Response, next: NextFunction): void {

		try {
			this.logger.warn(`Successful payment:\n${JSON.stringify(req.body, null, 2)}`);

			const promise = new Promise(async (resolve, reject) => {
				const paramsCheckResult = await this.checkParams(req.body);

				if (!paramsCheckResult) {
					reject(new Error(`ERROR: Check payment result params failed, details:\n${req.body}`));
				} else {
					await this.paymentProcessingService.processSuccessfulPayment(req.body);
					resolve('done');
				}
			});

			promise
				.then(
					(result) => {
						return res.json({
							status: 'success',
						});
					},
					(error) => {
						if (error instanceof Error) {
							this.logger.error(error.message);
							return res.json({
								status: 'fail',
							});
						}
					}
				);

		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`ERROR: ${error.message}`);
			}
		}

	}

	public fail(req: Request, res: Response, next: NextFunction): void {

		try {
			this.logger.warn(`Failed payment:\n${JSON.stringify(req.body, null, 2)}`);

			const promise = new Promise(async (resolve, reject) => {
				const paramsCheckResult = await this.checkParams(req.body);

				if (!paramsCheckResult) {
					reject(new Error(`ERROR: Check payment result params failed, details:\n${req.body}`));
				} else {
					await this.paymentProcessingService.processFailedPayment(req.body);
					resolve('done');
				}
			});

			promise
				.then(
					(result) => {
						return res.json({
							status: 'success',
						});
					},
					(error) => {
						if (error instanceof Error) {
							this.logger.error(error.message);
							return res.json({
								status: 'fail',
							});
						}
					}
				);

		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`ERROR: ${error.message}`);
			}
		}

	}

	private async checkParams(params: IPaymentProcessingParams): Promise<boolean> {

		const { signature, amount, orderId, uid, gtid } = params;

		if (!signature) {
			const errMsg = `ERROR: Missing signature: ${params}`;
			this.logger.error(errMsg);
			return false;
		}

		if (!amount) {
			const errMsg = `ERROR: Missing amount: ${params}`;
			this.logger.error(errMsg);
			return false;
		}

		if (!orderId) {
			const errMsg = `ERROR: Missing orderId: ${params}`;
			this.logger.error(errMsg);
			return false;
		}

		if (!uid) {
			const errMsg = `ERROR: Missing uid: ${params}`;
			this.logger.error(errMsg);
			return false;
		}

		if (!gtid) {
			const errMsg = `ERROR: Missing gtid: ${params}`;
			this.logger.error(errMsg);
			return false;
		}

		const hashData: IHashData = {
			amount,
			orderId: Number(orderId),
			uid,
			gtid
		};

		const calculatedHash = await this.robokassaService.calculateHash(hashData);

		return signature === calculatedHash;
	}

}