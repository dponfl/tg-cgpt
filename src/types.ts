export enum Messenger {
	TELEGRAM = 'telegram'
}

export enum GeneralServiceResponseStatus {
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR'
}

export interface IGeneralServiceResponse {
	status: GeneralServiceResponseStatus;
	payload?: unknown;
}