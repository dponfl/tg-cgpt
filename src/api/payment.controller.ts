import { ILogger } from '../logger/logger.interface.js';
import { BaseController } from './base.controller.js';
import { NextFunction, Request, Response } from 'express';

export class PaymentProcessingController extends BaseController {
	constructor(
		public readonly logger: ILogger
	) {
		super(logger);
		this.bindRoutes([
			{ path: '/success', method: 'post', func: this.success },
			{ path: '/fail', method: 'post', func: this.fail },
		]);
	}

	public success(req: Request, res: Response, next: NextFunction) {
		this.logger.info(`success() of PaymentProcessingController`);
		this.logger.warn(`req params: ${JSON.stringify(req.params, null, 2)}`);
		res.send(`success() of PaymentProcessingController`);
	}

	public fail(req: Request, res: Response, next: NextFunction) {
		this.logger.info(`fail() of PaymentProcessingController`);
		res.send(`fail() of PaymentProcessingController`);
	}

}