import { Kysely } from 'kysely';
import moment from 'moment';
import { ILogger } from '../logger/logger.interface.js';
import { GroupTransactionPaymentStatus, GroupTransactionServiceName, IDatabase } from '../storage/mysql.interface.js';
import { IUtils } from '../utils/utils.class.js';
import { IPaymentProcessingParams, IPaymentProcessingService } from './payments.interface.js';

export class PaymentService implements IPaymentProcessingService {
	constructor(
		private readonly logger: ILogger,
		private readonly utils: IUtils,
		private readonly dbConnection: Kysely<IDatabase>
	) { }

	public async processSuccessfulPayment(params: IPaymentProcessingParams): Promise<void> {

		const methodName = 'processSuccessfulPayment';

		try {

			const { signature, amount, orderId, uid, gtid } = params;

			/**
			 * Выполняем серию проверок на корректность данных
			 */

			const gtRecRaw = await this.dbConnection
				.selectFrom('groupTransactions')
				.selectAll()
				.where('guid', '=', gtid)
				.execute();

			if (
				!gtRecRaw
				|| !Array.isArray(gtRecRaw)
				|| gtRecRaw.length !== 1
			) {
				throw new Error(`Cannot get gt rec or several recs for gtid=${gtid}`);
			}

			const {
				userGuid: gtUserGuid,
				amount: gtAmount,
				id: gtOrderId,
				serviceName,
				purchasedQty,
			} = gtRecRaw[0];


			if (gtUserGuid !== uid) {
				throw new Error(`Mismatch userId: uid=${uid} gtUserGuid=${gtUserGuid}`);
			}

			if (gtAmount !== amount) {
				throw new Error(`Mismatch amount: amount=${amount} gtAmount=${gtAmount}`);
			}

			if (gtOrderId?.toString() !== orderId) {
				throw new Error(`Mismatch id: orderId=${orderId} gtOrderId=${gtOrderId}`);
			}

			/**
			 * Обновляем статус успешной транзакции
			 */

			await this.dbConnection
				.updateTable('groupTransactions')
				.set({
					updatedAt: moment().utc().format(),
					status: GroupTransactionPaymentStatus.SUCCESS
				})
				.where('guid', '=', gtid)
				.execute();

			/**
			 * Обновляем статусы оставшихся транзакций того же пользователя
			 */

			await this.dbConnection
				.updateTable('groupTransactions')
				.set({
					updatedAt: moment().utc().format(),
					status: GroupTransactionPaymentStatus.DECLINED
				})
				.where('userGuid', '=', uid)
				.where('status', '=', GroupTransactionPaymentStatus.PROCESSING)
				.execute();

			/**
			 * Обновляем данные лимитов на пользование сервисом
			 */

			const serviceUsageRecRaw = await this.dbConnection
				.selectFrom('serviceUsage')
				.selectAll()
				.where('userGuid', '=', uid)
				.execute();

			if (
				!serviceUsageRecRaw
				|| !Array.isArray(serviceUsageRecRaw)
				|| serviceUsageRecRaw.length !== 1
			) {
				throw new Error(`Cannot get serviceUsage rec or several recs for userGuid=${uid}`);
			}

			const serviceUsageRec = serviceUsageRecRaw[0];

			switch (serviceName) {
				case GroupTransactionServiceName.GPT:

					const { gptPurchased } = serviceUsageRec;
					const { gpt: gptNewPurchased } = JSON.parse(purchasedQty);

					await this.dbConnection
						.updateTable('serviceUsage')
						.set({
							updatedAt: moment().utc().format(),
							gptPurchased: gptPurchased + gptNewPurchased
						})
						.where('guid', '=', serviceUsageRec.guid)
						.execute();

					break;
				case GroupTransactionServiceName.MJ:

					const { mjPurchased } = serviceUsageRec;
					const { mj: mjNewPurchased } = JSON.parse(purchasedQty);

					await this.dbConnection
						.updateTable('serviceUsage')
						.set({
							updatedAt: moment().utc().format(),
							mjPurchased: mjPurchased + mjNewPurchased
						})
						.where('guid', '=', serviceUsageRec.guid)
						.execute();

					break;
				case GroupTransactionServiceName.GPT_MJ:

					const { gptPurchased: gptP } = serviceUsageRec;
					const { mjPurchased: mjP } = serviceUsageRec;
					const { gpt: gptNewP, mj: mjNewP } = JSON.parse(purchasedQty);

					await this.dbConnection
						.updateTable('serviceUsage')
						.set({
							updatedAt: moment().utc().format(),
							gptPurchased: gptP + gptNewP,
							mjPurchased: mjP + mjNewP
						})
						.where('guid', '=', serviceUsageRec.guid)
						.execute();

					break;
				default:
					throw new Error(`Unknown GT service name`);
			}




		} catch (error) {
			this.utils.errorLog(this, error, methodName);
		}


	}
	processFailedPayment(params: IPaymentProcessingParams) {
		throw new Error('Method not implemented.');
	}


}