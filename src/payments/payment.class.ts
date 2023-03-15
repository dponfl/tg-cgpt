import { ILogger } from '../logger/logger.interface.js';
import { IPaymentProcessingParams, IPaymentProcessingService } from './payments.interface.js';

export class PaymentService implements IPaymentProcessingService {
	constructor(
		private readonly logger: ILogger
	) { }

	public async processSuccessfulPayment(params: IPaymentProcessingParams): Promise<void> {
		setTimeout(() => {
			this.logger.info(`Log from setTimeout of processSuccessfulPayment:\n${JSON.stringify(params, null, 2)}`);
		}, 5000);
	}
	processFailedPayment(params: IPaymentProcessingParams) {
		throw new Error('Method not implemented.');
	}


}