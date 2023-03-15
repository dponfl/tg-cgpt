import { ILogger } from '../logger/logger.interface.js';
import { BaseController } from './base.controller.js';
import { NextFunction, Request, Response } from 'express';
import { IPaymentProcessingParams, IPaymentProcessingService } from '../payments/payments.interface.js';

export class PaymentProcessingController extends BaseController {
	constructor(
		public readonly logger: ILogger,
		private readonly paymentProcessingService: IPaymentProcessingService
	) {
		super(logger);
		this.bindRoutes([
			{ path: '/success', method: 'post', func: this.success },
			{ path: '/fail', method: 'post', func: this.fail },
		]);
	}

	public success(req: Request, res: Response, next: NextFunction): Response {

		this.logger.warn(`Successful payment: ${JSON.stringify(req.body, null, 2)}`);

		new Promise((resolve) => {
			this.paymentProcessingService.processSuccessfulPayment(req.body)
				.then(resolve('success'));
		});

		this.logger.info(`Sending response to PG`);
		return res.json({
			status: 'success',
		});
	}

	public fail(req: Request, res: Response, next: NextFunction): Response {
		this.logger.info(`fail() of PaymentProcessingController`);
		res.send(`fail() of PaymentProcessingController`);

		return res.json({
			status: 'success',
		});
	}

	private checkParams(params: IPaymentProcessingParams): boolean {

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

		return true;
	}

}