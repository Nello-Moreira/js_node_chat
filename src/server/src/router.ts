import type http from 'node:http';
import type { HttpMethods } from './helpers';

type Req = http.IncomingMessage;
type Res = http.ServerResponse;
type Endpoint =
	| ((req: Req, res: Res) => Promise<void>)
	| ((req: Req, res: Res) => void);
type Endpoints = '/ping';
export type Router = Record<
	Endpoints,
	{ [METHOD in HttpMethods[number]]?: Endpoint }
>;
export const router: Router = {
	'/ping': {
		GET: (_req: Req, res: Res): void => {
			res.end('pong');
		},
	},
};
