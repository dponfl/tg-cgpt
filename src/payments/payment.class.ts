import { IPaymentProcessingService } from './payments.interface.js';

export class PaymentService implements IPaymentProcessingService {
	constructor() { }

	processSuccessfulPayment() {
		throw new Error('Method not implemented.');
	}
	processFailedPayment() {
		throw new Error('Method not implemented.');
	}


}