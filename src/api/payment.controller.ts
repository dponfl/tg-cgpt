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

		this.logger.warn(`req.body: ${JSON.stringify(req.body, null, 2)}`);

		res.setHeader('Content-Type', 'text/plain');
		res.write('you posted:\n');
		res.end(JSON.stringify(req.body, null, 2));

		// const body = req.body;
		// const bodyJson = JSON.parse(req.body);
		// this.logger.warn(`body: ${body}`);
		// this.logger.warn(`bodyJson: ${JSON.stringify(bodyJson, null, 2)}`);
		// res.send(`success() of PaymentProcessingController`);
	}

	public fail(req: Request, res: Response, next: NextFunction) {
		this.logger.info(`fail() of PaymentProcessingController`);
		res.send(`fail() of PaymentProcessingController`);
	}

}