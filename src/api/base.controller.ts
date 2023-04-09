import { Router } from 'express';
import { ILogger } from '../logger/logger.interface.js';
import { IControllerRoute } from './route.interface.js';

export abstract class BaseController {
	private readonly _router: Router;

	constructor(
		public readonly logger: ILogger
	) {
		this._router = Router();
	}

	get router() {
		return this._router;
	}

	protected bindRoutes(routes: IControllerRoute[]) {
		for (const route of routes) {
			this.logger.info(`[${route.method}] ${route.path}`);
			const handler = route.func.bind(this);
			this.router[route.method](route.path, handler);
		}
	}
}