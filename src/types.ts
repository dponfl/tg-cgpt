export enum Messenger {
	TELEGRAM = 'telegram'
}

export enum GeneralServiceResponseStatus {
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR'
}

export enum ChatSceneNames {
	mainGptScene = 'mainGptScene',
	afterPaymentGptScene = 'afterPaymentGptScene',
	mainMJScene = 'mainMJScene',
	afterPaymentMJScene = 'afterPaymentMJScene',
}

export interface IGeneralServiceResponse {
	status: GeneralServiceResponseStatus;
	payload?: unknown;
}